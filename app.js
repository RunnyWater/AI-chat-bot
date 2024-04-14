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
dotenv.config();

const app = express();

app.use(cookieParser());
const api_key_exa =  process.env.API_KEY_EXA;
const api_key_ninja = process.env.API_KEY_NINJA;
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



async function sendDetailedQueryToExa(query) {
    try {
        const textContentsResults = await exa.searchAndContents(query, {
            numResults:1,
            highlights: { highlightsPerUrl: 5 }
          });
        //   console.log(textContentsResults)
          textContentsResults.results.forEach(result => {
            addNewQuestion(userId, result.id, query, result.highlights);
            

        });
        return textContentsResults.results[0]?.highlights[0];
    } catch (error) {
        console.error('Error sending detailed query to Exa:', error);
    }
}

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const connection_string = process.env.CONNECTION_STRING;



const client = new MongoClient(connection_string);
let db
let user_count;
async function connectToDatabase() {
  try {
     await client.connect();
     console.log('Connected to MongoDB');
     db = client.db('ai_extension'); // Specify your database name
    //  console.log(db.admin());
     user_count = await getUserCount();
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

async function getUserCount() {
  try {
    const count = await db.collection('users').countDocuments();
    return count;
  } catch (error) {
      console.error("Error getting user count:", error);
  }
}

connectToDatabase();

app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    console.log('register', username, password, email);
    if (await usernameExists(username)) {
      console.log("Username already exists");
      res.send("1");
    }else if (await emailExists(email)) {
      console.log("Email already exists");
      res.send("2");
      
    }else{// Hash the password
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
    // Load existing users
    const users = loadUsers();

    // Generate a new user ID
    const newUserId = users.users.length > 0 ? Math.max(...users.users.map(user => parseInt(user.userId))) + 1 : 1;

    // Create a new user object with an empty questionsId array
    const newUser = {
        userId: newUserId.toString(), // Ensure userId is a string to match the existing structure
        questionsId: []
    };

    // Add the new user to the list of users
    users.users.push(newUser);

    // Save the updated list of users back to the file
    saveUsers(users);

    console.log(`New user with ID ${newUserId} created.`);
}

  async function getIdByUsername(username) {
    try {
       const user = await db.collection('users').findOne({ username });
       if (user) {
         return user.user_id.toString(); // Assuming user_id is the field you want to return
       } else {
         return "User not found"; // Return a specific error message or code
       }
    } catch (error) {
       console.error("Error getting user ID:", error);
       throw error; // Rethrow the error to be handled by the caller
    }
   }

  async function usernameExists(username) {
    try {
       const user = await db.collection('users').findOne({ username });
       return user !== null;
    } catch (error) {
       console.error("Error checking username:", error);
       throw error; // Rethrow the error to be handled by the caller
    }
   }
   
   async function emailExists(email) {
    try {
       const user = await db.collection('users').findOne({ email });
       return user !== null;
    } catch (error) {
       console.error("Error checking email:", error);
       throw error; // Rethrow the error to be handled by the caller
    }
   }
  
  // Login route
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('login', username, password);
   
    if (!usernameExists(username)){
      return res.send("1");
    }
    const user = await db.collection('users').findOne({ username });
   try {
      // Wrap bcrypt.compare in a Promise
      const isMatch = await new Promise((resolve, reject) => {
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) {
            reject(err); // Reject the promise if there's an error
          } else {
            resolve(result); // Resolve the promise with the result
          }
        });
      });
  
      if (isMatch) {
        userId = await getIdByUsername(username);
        global_username = username;
        console.log(userId, global_username);
        
        // Generate the token before sending the response
        const token = jwt.sign({ username: req.body.username }, SECRET_KEY, { expiresIn: '24h' });
        // Set the token as a HttpOnly cookie
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });

        // Now send the response
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
    // console.log(global_username);
    if (userId === "0") {
        res.send("0");
    }
    else {
        res.send(global_username);
    }
   
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });


app.get('/login', (req, res) => {
    res.send(fs.readFileSync('./views/login.html', 'utf8'));
});

app.get('/register', (req, res) => {
    res.send(fs.readFileSync('./views/register.html', 'utf8'));
})

async function getNewRandomFact() {
    const url = 'https://api.api-ninjas.com/v1/facts?limit=1';
    const options = {
        method: 'GET',
        headers: {
            'X-Api-Key': api_key_ninja // Replace 'YOUR_API_KEY' with your actual API key
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data[0].fact; // Return the fact
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return ''; // Return an empty string or handle the error as needed
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
            random_fact = await getNewRandomFact(); // Await the completion of the fetch operation
            // Assuming sendDetailedQueryToExa now returns a Promise that resolves to the desired value
            const detailedQueryResult = await sendDetailedQueryToExa(query);
            let answer = [detailedQueryResult, random_fact];
            res.send(answer);
            random_fact = '';
        } catch (error) {
            console.error('Error fetching random fact or sending detailed query:', error);
            res.sendStatus(500); // Send a server error response
        }
    }
});

app.patch('/ai_update', (req, res) => {
    const responseText = req.body.responseText;
    // console.log(responseText)
    const questionId = getQuestionIdByContent(responseText);
    let newResponse = getNextResponse(userId, questionId);
    // console.log(newResponse);
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
        // Handle the case where the question is not found, e.g., return a default value or an error message
        return "Question not found";
    }
    if (!question) {
        // Handle the case where the question is not found, e.g., return a default value or an error message
        return "Question not found";
    }
    return question.fact;
}



function getUserQuestionHistory(userId) {
    const users = loadUsers();
    const questions = loadQuestions();

    // Find the user
    const user = users.users.find(user => user.userId === userId);
    if (!user) {
        return { error: 'User not found' };
    }
    console.log(user)
    // Initialize categories
    const categories = {
        today: [],
        yesterday: [],
        "last 7 Days": [],
        older: []
    };

    // Get today's date
    const date = new Date();
    const today = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const partsToday = today.split("-");
    const dateToday = new Date(`${partsToday[1]}/${partsToday[0]}/${partsToday[2]}`);
    // Fetch the user's question history and categorize them
    user.questionsId.forEach(qId => {
        const question = questions.questions.find(q => q.id === qId[0]);
        if (!question) {
            return; // Skip if question not found
        }
        
        // Convert the given date string into a Date object
        const dateString = qId[2];
        const parts = dateString.split("-");
        const questionDate = new Date(parts);
        const formattedDate = `${questionDate.getMonth()+1}-${questionDate.getDate()}-${questionDate.getFullYear()}`;
        const partsFormattedDate = formattedDate.split("-");
        const dateFormattedDate = new Date(`${partsFormattedDate[1]}/${partsFormattedDate[0]}/${partsFormattedDate[2]}`);
        // Calculate the difference in milliseconds
        const diffInMilliseconds = dateToday - dateFormattedDate;

        // Convert the difference from milliseconds to days
        const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
        // Categorize the question based on its date
        if (diffInDays === 0) {
            categories.today.push(question.question);
        } else if (diffInDays === 1) {
            categories.yesterday.push(question.question);
        } else if (diffInDays <= 7) {
            categories.lastWeek.push(question.question);
        } else {
            categories.older.push(question.question);
        }
    });

    return categories;
}

app.get('/', (req, res) => { 
    res.send(fs.readFileSync('./views/homepage.html', 'utf8'));
});


function getResponseByUserIdAndQuestionId(userId, questionId) {
    // Load users and questions
    const users = loadUsers();
    const questions = loadQuestions();

    // Find the user
    const user = users.users.find(user => user.userId === userId);
    if (!user) {
        return { error: 'User not found' };
    }

    // Find the question
    const question = questions.questions.find(q => q.id === questionId);
    if (!question) {
        return { error: 'Question not found' };
    }

    // Find the user's current response index for the question
    const questionIndex = user.questionsId.findIndex(q => q[0] === questionId);
    if (questionIndex === -1) {
        return { error: 'User has not interacted with this question' };
    }

    const responseIndex = user.questionsId[questionIndex][1];
    const response = question.responses[responseIndex];

    return response;
}


function getWholeQuestionById(questionId) {
    const questions = loadQuestions();
    const question = questions.questions.find(q => q.id === questionId);
    return question || null;
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
    // Load users data
    const users = loadUsers();

    // Find the user by userId
    const user = users.users.find(user => user.userId === userId);
    // If the user is found
    if (user) {
        // Check if the questionId is already in the user's questionsId array
        if (!user.questionsId.some(qId => qId[0] === questionId)) {
            // Generate a timestamp for the current date and time
            const date = new Date();
            const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
            
            // Add the questionId, initial response index, and timestamp to the user's questionsId array
            user.questionsId.push([questionId, 0, formattedDate]); // Assuming the initial response index is 0
            console.log(`Question ID ${questionId} added to user ${userId} on ${formattedDate}.`);
        } else {
            console.log(`User ${userId} already has question ID ${questionId}.`);
        }

        // Save the updated users data
        saveUsers(users);
    } else {
        console.log(`User with ID ${userId} not found.`);
    }
}


function addNewQuestion(userId, id, question, responses) {
    // console.log(userId, id, question, responses)
    const users = loadUsers();
    const questions = loadQuestions();
    // Add the new question to the questions list
    const newQuestionId = id;
    // console.log(random_fact);
    questions.questions.push({
        id: newQuestionId,
        question,
        responses,
        fact: random_fact
    });
    saveQuestions(questions);

    // Update the user's current question ID and response index
    const user = users.users.find(user => user.userId.toString() === userId.toString());
    if (user) {
        user.questionsId.push([newQuestionId, 0]); // Add new question ID with initial response index 0
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

    // Increment the currentResponseIndex and wrap around if necessary
    const newResponseIndex = (responseIndex + 1) % question.responses.length;
    user.questionsId[questionIndex][1] = newResponseIndex; // Update the response index in the user's questionsId
    saveUsers(users); // Save the updated user data

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
    res.clearCookie('token'); // Clear the token cookie
    res.sendStatus(200); // Send a success status
});

app.use((req, res, next) => {
    console.log('Cookies:', req.cookies); // Log the cookies to see if they're being parsed
    const token = req.cookies?.token ?? null;
    if (token == null) return res.sendStatus(401); // if there isn't any token

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
});

async function loadUserById(userId) {
    // Load user data from your database
    // This is a placeholder implementation; replace it with your actual database logic
    const users = loadUsers(); // Assuming this function loads all users
    return users.users.find(user => user.userId === userId);
}

async function saveUser(user) {
    // Save the updated user data back to your database
    // This is a placeholder implementation; replace it with your actual database logic
    const users = loadUsers(); // Load all users
    const index = users.users.findIndex(u => u.userId === user.userId);
    if (index !== -1) {
        users.users[index] = user; // Update the user data
        saveUsers(users); // Save the updated list of users
    }
}

app.delete('/delete_history', async (req, res) => {
    // res.status(200).send({ message: 'DELETE request received' });
    const question  = req.body.question ;
    // Assuming you have a way to identify the current user, e.g., through a session or token

    try {
        // Load the current user's data
        const user = await loadUserById(userId);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        const question_id = getQuestionIdByContent(question);
        // Find the index of the question in the user's history
        const questionIndex = user.questionsId.findIndex(q => q[0] === question_id);
        if (questionIndex === -1) {
            return res.status(404).send({ error: 'Question not found in user history' });
        }

        // Remove the question from the user's history
        user.questionsId.splice(questionIndex, 1);

        // Save the updated user data
        await saveUser(user);

        // Send a success response
        // res.sendStatus(200);
    } catch (error) {
        console.error('Error deleting question from history:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});
