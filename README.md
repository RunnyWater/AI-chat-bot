# AI-chat-bot Overview
A website with an AI model fine-tuned for the specific requirements provided by the University, allowing users to ask questions on various topics and receive quick responses.
## API used
For generating answers the technology Exa API was used: [Exa API](https://exa.ai/).

To generate random facts, I used the Facts API provided by API Ninjas: [API Facts](https://api-ninjas.com/api/facts) by [API Ninjas](https://api-ninjas.com/).
## Exa API
Exa AI API is a powerful platform designed to provide advanced artificial intelligence services. It offers a range of functionalities, including natural language processing (NLP), machine learning, and data analytics, which can be integrated into applications to enhance their capabilities. The API allows developers to leverage sophisticated AI models for tasks such as language understanding, text generation, sentiment analysis, and more. By using Exa AI API, businesses can automate complex processes, gain insights from large datasets, and create intelligent applications that interact seamlessly with users. The API is designed to be user-friendly, providing comprehensive documentation and support to facilitate easy integration and implementation.
- **Model Tuning**: The model is fine-tuned to address specific project requirements. This customization enhances accuracy and relevance for targeted tasks.
- **API Usage Optimization**: API requests are managed efficiently to optimize performance and reduce costs. This approach ensures smooth and scalable integration into applications.

## Tech Stack:
- **Client side**: _JavaScript, HTML, and CSS_
- **Server side**: _NodeJS, REST API, JSON_
- **API**: _Exa AI API, Facts API_
- **Database and Security**: _MongoDB, JWT token cookies_

<br><br><br><br>

![](http://wes.io/Vfcs/content) 
# AI Chat Bot Docker Setup
This repository contains the setup script for initializing and running a Dockerized AI chatbot application. The setup script automates the process of configuring environment variables, building Docker images, and starting the containers.

## Requirements
Before using the setup script, ensure that you have the following installed:

- Docker (with Docker Compose)
- Git (optional, if you clone this repository)

## Getting Started
### 1. Clone the Repository using Git:

```
git clone https://github.com/RunnyWater/AI-chat-bot.git
cd AI-chat-bot
```
### 2. Run setup file 
(Zero setup) If you don't have .env file with API keys:


- For Windows Users
    ```
    setup.bat
    ```
- For Linux/macOS Users:
    ```
    chmod +x setup.sh
    ./setup.sh
    ```

If you already have API keys inside .env file and sure they're named right:

```
docker-compose up --build -d
```    



### 3. Use the application 

The web application runs on [localhost:3000](http://localhost:3000/).

<br>
This will install dependencies, run the setup.js script and eventually run docker-compose up --build -d.
