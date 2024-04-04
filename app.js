import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import Exa from 'exa-js';
import { stringify } from 'querystring';
import request from 'request';
// require('dotenv').config();

// loadEnv.js
import dotenv from 'dotenv';
dotenv.config();



const app = express();
const api_key_exa =  process.env.API_KEY_EXA;
const api_key_ninja = process.env.API_KEY_NINJA;
const exa = new Exa(api_key_exa);
// const user_id = '2';


async function sendDetailedQueryToExa(query, userId) {
    try {
        const textContentsResults = await exa.searchAndContents(query, {
            numResults:1,
            highlights: { highlightsPerUrl: 5 }
          });
          textContentsResults.results.forEach(result => {
            addNewQuestion(userId, result.id, query, result.highlights);
            return result.highlights[0];
        });
    } catch (error) {
        console.error('Error sending detailed query to Exa:', error);
    }
}

app.use(express.static('public'));
app.use(bodyParser.json());

app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });





async function getNewRandomFact() {
  const url = 'https://api.api-ninjas.com/v1/facts?limit=1';
    const options = {
    method: 'GET',
    headers: {
        'X-Api-Key': api_key_ninja // Replace 'YOUR_API_KEY' with your actual API key
    }
    };

  fetch(url, options)
  .then(response => {
      if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
  })
  .then(data => {
        return data;
  })
  .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
  });
}




app.post('/ai_answer', (req, res) => {
    const query = req.body.aiInput;
    const UserId = req.body.UserId;
    const id = getQuestionIdByContent(query)
    if (id){
        addQuestionIdToUser(UserId,id);
        let answer = [getResponseByUserIdAndQuestionId(UserId, id), getRandomFactFromQuestionId(id)];
        res.send(answer);
    }else{
        let answer = [sendDetailedQueryToExa(query, UserId), getNewRandomFact()]
        res.send(answer);
    }
});

app.post('/ai_update', (req, res) => {
    const userId = req.body.UserId;
    const responseText = req.body.responseText;
    const questionId = getQuestionIdByContent(responseText);
    let newResponse = getNextResponse(userId, questionId);
    console.log(newResponse);
    res.send(newResponse);

});


app.post('/get_history', (req, res) => {
    const UserId = req.body.userId;
    const questionHistory = getUserQuestionHistory(UserId);
    res.send(questionHistory);
});


function getRandomFactFromQuestionId(questionId){
    const questions = loadQuestions();
    const question = questions.questions.find(q => q.id === questionId);
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

    // Fetch the user's question history
    const questionHistory = user.questionsId.map(qId => {
        const question = questions.questions.find(q => q.id === qId[0]);
        if (!question) {
            return null; // This should not happen, but it's a safeguard
        }
        return question.question;
    }).filter(item => item !== null); // Filter out any null items
    return questionHistory;
}

app.get('/', (req, res) => { 
    res.send(fs.readFileSync('./views/index.html', 'utf8'));
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
            // Add the questionId to the user's questionsId array
            user.questionsId.push([questionId, 0]); // Assuming the initial response index is 0
            console.log(`Question ID ${questionId} added to user ${userId}.`);
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
    const users = loadUsers();
    const questions = loadQuestions();

    // Add the new question to the questions list
    const newQuestionId = id;
    questions.questions.push({
        id: newQuestionId,
        question,
        responses,
        fact: getNewRandomFact()
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
