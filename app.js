import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import Exa from 'exa-js';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import cookieParser from 'cookie-parser'
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

app.use(cookieParser());
// Get you api-key at https://exa.ai/
const api_key_exa =  process.env.API_KEY_EXA;
// Get you api-key at https://api-ninjas.com/api
const api_key_ninja = process.env.API_KEY_NINJA;
// Get a connection string to this collection
const connection_string = process.env.CONNECTION_STRING;
// Make and put your dataset name
const DATASET_NAME = 'chatbot';

if (!api_key_exa || !api_key_ninja || !connection_string) {
    console.error('Please set all environment variables.');
    process.exit(1);
}

const exa = new Exa(api_key_exa);
const SECRET_KEY = crypto.randomBytes(64).toString('hex');

var random_fact = '';
var userId = "0";
var global_username = '';
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => { 
    res.send(fs.readFileSync('./views/homepage.html', 'utf8'));
});


async function sendDetailedQueryToExa(query) {
    try {
        const textContentsResults = await exa.searchAndContents(query, {
            numResults:1,
            highlights: { highlightsPerUrl: 5 }
          });
          textContentsResults.results.forEach(result => {
            addNewQuestion(userId, result.id, query, result.highlights);
            

        });
        return textContentsResults.results[0]?.highlights[0];
    } catch (error) {
        console.error('Error sending detailed query to Exa:', error);
    }
}





let db;
let user_count;
async function connectToDatabase() {
  try {
    const client = new MongoClient(connection_string);
    
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db(DATASET_NAME);
    if (!db) {
        console.error("Database connection not established.");
        process.exit(1); 
    }

    user_count = await getUserCount();
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

connectToDatabase();



async function getUserCount() {
  try {
    const count = await db.collection('users').countDocuments();
    return count;
  } catch (error) {
      console.error("Error getting user count:", error);
  }
}


app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    console.log('register', username, password, email);
    if (await usernameExists(username)) {
      console.log("Username already exists");
      res.send("1");
    }else if (await emailExists(email)) {
      console.log("Email already exists");
      res.send("2");
      
    }else{
    const hashedPassword = await bcrypt.hash(password, 10);
    try{
        await db.collection('users').insertOne({ user_id : parseInt(user_count+1), username, password: hashedPassword, email });
      }
    catch{
      "-1"
    }
    console.log('User registered successfully');
    user_count++;
    makeNewUser(username, password);
    res.send("0");
    }
  });
  
  function makeNewUser() {
    const users = loadUsers();

    const newUserId = users.users.length > 0 ? Math.max(...users.users.map(user => parseInt(user.userId))) + 1 : 1;

    const newUser = {
        userId: newUserId.toString(),
        questionsId: []
    };

    users.users.push(newUser);

    saveUsers(users);

    console.log(`New user with ID ${newUserId} created.`);
}

  async function getIdByUsername(username) {
    try {
       const user = await db.collection('users').findOne({ username });
       if (user) {
         return user.user_id.toString();
       } else {
         return "User not found"; 
       }
    } catch (error) {
       console.error("Error getting user ID:", error);
       throw error; 
    }
   }

  async function usernameExists(username) {
    try {
       const user = await db.collection('users').findOne({ username });
       return user !== null;
    } catch (error) {
       console.error("Error checking username:", error);
       throw error;
    }
   }
   
   async function emailExists(email) {
    try {
       const user = await db.collection('users').findOne({ email });
       return user !== null;
    } catch (error) {
       console.error("Error checking email:", error);
       throw error;
    }
   }
  
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('login', username, password);
   
    if (!usernameExists(username)){
      return res.send("1");
    }
    const user = await db.collection('users').findOne({ username });
   try {
     
      const isMatch = await new Promise((resolve, reject) => {
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result); 
          }
        });
      });
  
      if (isMatch) {
        userId = await getIdByUsername(username);
        global_username = username;
        console.log(userId, global_username);
        
        const token = jwt.sign({ username: req.body.username }, SECRET_KEY, { expiresIn: '24h' });
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });

        return res.send("0");
      } else {
        return res.send("1");
      }
   } catch (error) {
      console.error(error);
      return res.send("1");
   }
});
  
app.get('/check_login', (req, res) => {
    if (userId === "0") {
        res.send("0");
    }
    else {
        res.send(global_username);
    }
   
})


app.get('/login', (req, res) => {
    res.send(fs.readFileSync('./views/login.html', 'utf8'));
});

app.get('/register', (req, res) => {
    res.send(fs.readFileSync('./views/register.html', 'utf8'));
})

async function getNewRandomFact() {
    const url = 'https://api.api-ninjas.com/v1/facts';
    const options = {
        method: 'GET',
        headers: {
            'X-Api-Key': api_key_ninja
        }
    };
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            const errorBody = await response.text();
            console.error('Response body:', errorBody);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const fact = data[0]?.fact;
        console.log(fact);
        return fact; 
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return ''; 
    }
}

app.post('/get_answer', (req, res) => {
    const question = req.body.question;
    const id = getQuestionIdByContent(question);
    if(question===undefined){
        console.log("No question found")
        return;
    }
    const randomFact = getRandomFactFromQuestionId(id);
    const response = getResponseByUserIdAndQuestionId(userId, id);
    res.send([question, response, randomFact])
});



app.post('/ai_answer', async (req, res) => {
    const query = req.body.aiInput;
    const id = getQuestionIdByContent(query);

    if (id) {
        addQuestionIdToUser(userId, id);
        let answer = [getResponseByUserIdAndQuestionId(userId, id), getRandomFactFromQuestionId(id)];
        res.send(answer);
    } else {
        try {
            random_fact = await getNewRandomFact();
            const detailedQueryResult = await sendDetailedQueryToExa(query);
            let answer = [detailedQueryResult, random_fact];
            res.send(answer);
            random_fact = '';
        } catch (error) {
            console.error('Error fetching random fact or sending detailed query:', error);
            res.sendStatus(500); 
        }
    }
});

app.patch('/ai_update', (req, res) => {
    const responseText = req.body.responseText;
    const questionId = getQuestionIdByContent(responseText);
    let newResponse = getNextResponse(userId, questionId);
    res.send(newResponse);

});


app.get('/get_history', (req, res) => {
    try
    { console.log(userId)
    if (parseInt(userId)===0){
        return res.json('0');
    }
    const questionHistory = getUserQuestionHistory(userId);
    res.json(questionHistory);
    } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
}
});


function getRandomFactFromQuestionId(questionId) {
    const questions = loadQuestions();
    const question = questions.questions.find(q => q.id === questionId);
    if (!question) {
        return "Question not found";
    }
    return question.fact;
}



function getUserQuestionHistory(userId) {
    const users = loadUsers();
    const questions = loadQuestions();

    const user = users.users.find(user => user.userId === userId);
    if (!user) {
        return { error: 'User not found' };
    }

    const categories = {
        today: [],
        yesterday: [],
        "last 7 Days": [],
        older: []
    };

    const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

    user.questionsId.forEach(qId => {
        const question = questions.questions.find(q => q.id === qId[0]);
        if (!question) {
            return;
        }

        const questionDate = new Date(Date.UTC(qId[2].split('-')[2], qId[2].split('-')[1] - 1, qId[2].split('-')[0]));

        const diffInDays = Math.floor((today - questionDate) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            categories.today.push(question.question);
        } else if (diffInDays === 1) {
            categories.yesterday.push(question.question);
        } else if (diffInDays <= 7) {
            categories["last 7 Days"].push(question.question);
        } else {
            categories.older.push(question.question);
        }
    });
    Object.keys(categories).forEach(key => {
        categories[key].reverse();
    });
    return categories;
}



function getResponseByUserIdAndQuestionId(userId, questionId) {
    const users = loadUsers();
    const questions = loadQuestions();

    const user = users.users.find(user => user.userId === userId);
    if (!user) {
        return { error: 'User not found' };
    }

    const question = questions.questions.find(q => q.id === questionId);
    if (!question) {
        return { error: 'Question not found' };
    }

    const questionIndex = user.questionsId.findIndex(q => q[0] === questionId);
    if (questionIndex === -1) {
        return { error: 'User has not interacted with this question' };
    }

    const responseIndex = user.questionsId[questionIndex][1];
    const response = question.responses[responseIndex];

    return response;
}


function getQuestionIdByContent(query) {
    if (typeof query !== 'string') {
        return false;
    }
    if (typeof query !== 'string') {
        return false;
    }
    const questions = loadQuestions();
    const matchingQuestions = questions.questions.find(q => q.question.toLowerCase().replace(/[^a-z A-Z ]/g, "").replace(" ", "").includes(query.toLowerCase().replace(/[^a-z A-Z ]/g, "").replace(" ", "")));
    return matchingQuestions === undefined ? false : matchingQuestions.id;
}


function addQuestionIdToUser(userId, questionId) {
    const users = loadUsers();

    const user = users.users.find(user => user.userId === userId);
    if (user) {
        if (!user.questionsId.some(qId => qId[0] === questionId)) {
            const date = new Date();
            const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
            
            user.questionsId.push([questionId, 0, formattedDate]);
            console.log(`Question ID ${questionId} added to user ${userId} on ${formattedDate}.`);
        } else {
            console.log(`User ${userId} already has question ID ${questionId}.`);
        }

        saveUsers(users);
    } else {
        console.log(`User with ID ${userId} not found.`);
    }
}


function addNewQuestion(userId, id, question, responses) {
    const users = loadUsers();
    const questions = loadQuestions();
    const newQuestionId = id;
    const date = new Date();
    const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    questions.questions.push({
        id: newQuestionId,
        question,
        responses,
        fact: random_fact
    });
    saveQuestions(questions);

    const user = users.users.find(user => user.userId.toString() === userId.toString());
    if (user) {
        user.questionsId.push([newQuestionId, 0, formattedDate]); 
        saveUsers(users);
    }
}

function getNextResponse(userId, questionId) {
    const users = loadUsers();
    const user = users.users.find(user => user.userId === userId);
    if (!user) return null;

    const questions = loadQuestions();
    const questionIndex = user.questionsId.findIndex(q => q[0] === questionId);
    if (questionIndex === -1) return null;

    const responseIndex = user.questionsId[questionIndex][1];
    const question = questions.questions.find(q => q.id === questionId);
    if (!question) return null;

    const newResponseIndex = (responseIndex + 1) % question.responses.length;
    user.questionsId[questionIndex][1] = newResponseIndex;
    saveUsers(users);

    return question.responses[newResponseIndex];
}

function loadUsers() {
    const data = fs.readFileSync('public/history/users.json', 'utf8');
    return JSON.parse(data);
}

function saveUsers(users) {
    const data = JSON.stringify(users, null, 2);
    fs.writeFileSync('public/history/users.json', data);
}

function loadQuestions() {
    const data = fs.readFileSync('public/history/questions.json', 'utf8');
    return JSON.parse(data);
}

function saveQuestions(questions) {
    const data = JSON.stringify(questions, null, 2);
    fs.writeFileSync('public/history/questions.json', data);
}


app.post('/logout', (req, res) => {
    global_username = '';
    userId = '0';
    res.clearCookie('token');
    res.sendStatus(200); 
});


app.use((req, res, next) => {
    console.log('Cookies:', req.cookies);
    const token = req.cookies?.token ?? null;
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
});



async function loadUserById(userId) {
    const users = loadUsers(); 
    return users.users.find(user => user.userId === userId);
}

async function saveUser(user) {
    const users = loadUsers();
    const index = users.users.findIndex(u => u.userId === user.userId);
    if (index !== -1) {
        users.users[index] = user;
        saveUsers(users); 
    }
}

app.delete('/delete_history', async (req, res) => {
    const question  = req.body.question ;

    try {
        const user = await loadUserById(userId);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        const question_id = getQuestionIdByContent(question);
        const questionIndex = user.questionsId.findIndex(q => q[0] === question_id);
        if (questionIndex === -1) {
            return res.send({ error: 'Question not found in user history' });
        }

        user.questionsId.splice(questionIndex, 1);

        await saveUser(user);

        res.sendStatus(200);
    } catch (error) {
        console.error('Error deleting question from history:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});



app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
