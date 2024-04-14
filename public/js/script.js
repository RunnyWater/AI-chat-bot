let history_opened = false;

document.addEventListener('DOMContentLoaded', function() {
    fetch('/check_login')
        .then(response => response.text())
        .then(data => {
            if(data === '0'){
                document.getElementById('login_button').style.display= 'flex';
            }else{
                document.getElementById('login_button').style.display= 'none';
                document.getElementById('user_logged_in').innerHTML = `<img src="images/user_logged_in.png" class="icon__logout">
                <span style="padding-left: 5px;" id="user_name"><button class="log_out__button" id="log_out">${data}</button></span>`
                document.getElementById('log_out').addEventListener('click', function() {


                    if(confirm("Are you sure you want to log out?")){
                        logout()
                        history_opened= false
                    }else{
                        
                    }
                    
                    function logout() {
                        // Make a request to the server's logout endpoint
                        fetch('/logout', {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            // Redirect the user to the login page or homepage
                            window.location.href = '/login'; // Adjust the URL as necessary
                        })
                        .catch(error => {
                            console.error('There was a problem with the fetch operation:', error);
                        });
                    }

                })

            }})
        .catch((error) => {
            console.error('Error getting the response:', error);
        })
});



document.getElementById('showHistoryButton').addEventListener('click', function() {
    const historyList = document.getElementById('historyList');
    historyList.style.display = 'block';
    const hideHistoryButton = document.createElement('button');
    hideHistoryButton.id = 'hideHistoryButton';
    hideHistoryButton.className = 'title__general';
    hideHistoryButton.textContent = "⤬";
    hideHistoryButton.addEventListener('click', hideHistory);
    document.getElementById('historyContainer').appendChild(hideHistoryButton);
    setTimeout(function() {
        hideHistoryButton.style.opacity = '1'; 
    }, 10); // Delay in milliseconds

    if (!history_opened) {
        fetch('/get_history')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data === "0") {
                document.getElementById('history_label').innerHTML = "Please log in";
            } else {
                // Clear existing history
                document.getElementById('question__div').innerHTML = '';

                // Process each category
                Object.keys(data).forEach(category => {
                    // Check if the category has any questions
                    if (data[category].length > 0) {
                        // Create a container for the category if it doesn't exist
                        let categoryContainer = document.getElementById(`${category}Container`);
                        if (!categoryContainer) {
                            categoryContainer = document.createElement('div');
                            categoryContainer.id = `${category}Container`;
                            categoryContainer.className = 'categoryContainer'; // Add a class for styling
                            document.getElementById('question__div').appendChild(categoryContainer);
                        }

                        // Add a title for the category
                        const categoryTitle = document.createElement('h3');
                        categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1); // Capitalize the first letter
                        categoryContainer.appendChild(categoryTitle);

                        // Process each question in the category
                        data[category].forEach(question => {
                            // Create the question HTML
                            const questionItem = document.createElement('li');
                            questionItem.className = 'history__items';
                            questionItem.innerHTML = `
                                <button class="history__button" id="${question}">${question}</button>
                                <button class="transparent delete__history__item delete__history__item__image" id="delete_${question}"></button>
                            `;
                            categoryContainer.appendChild(questionItem);

                            // Add event listener for question click
                            document.getElementById(question).addEventListener('click', function() {
                                fetch('/get_answer', {
                                    method: 'POST',
                                    credentials: 'include',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ question: question }),
                                })
                                .then(response => response.json())
                                .then(data => {
                                    let [text, answerElementValue, randomFactValue] = data;
                                    document.getElementById('ai_user_search').innerText = text;
                                    document.getElementById('ai__search').style.display = "none";
                                    document.getElementById('ai__answer').innerText = answerElementValue;
                                    document.getElementById('ai_answer_list').style.display = "block";
                                    document.getElementById('random__fact__label').style.display = "block";
                                    document.getElementById('random__fact').innerText = randomFactValue;
                                })
                                .catch((error) => {
                                    console.error('Error getting the response:', error);
                                });
                            });

                            // Add event listener for delete click
                            document.getElementById(`delete_${question}`).addEventListener('click', function() {
                                fetch('/delete_history', {
                                    method: 'DELETE',
                                    credentials: 'include',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ question: question }),
                                })
                                .then(response => response.json())
                                .then(data => {
                                    // Remove the deleted item from the UI
                                    const itemElement = document.getElementById(`${question}`).parentElement;
                                    itemElement.remove(); // Remove the item from the UI
                                })
                                .catch((error) => {
                                    console.error('Error deleting question from history:', error);
                                    if (error.response) {
                                        error.response.text().then(text => console.log(text));
                                    } else {
                                        console.log('Error message:', error.message);
                                    }
                                });
                            });
                        });
                    }
                });

                history_opened = true;
            }
        })
        .catch((error) => {
            console.error('Error getting the response:', error);
        });
    }

    function hideHistory() {
        const historyList = document.getElementById('historyList');
        historyList.style.display = 'none';
        const hideHistoryButton = document.getElementById('hideHistoryButton');
        hideHistoryButton.parentNode.removeChild(hideHistoryButton);
    }
});

document.getElementById('ai_update').addEventListener('click', function() {
    const textarea = document.getElementById('ai_user_search').innerText;

    fetch('/ai_update', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responseText: textarea}),
    })
    .then(response => response.text())
    .then(data => {
        document.getElementById('ai__answer').innerText = data;

    })
    .catch((error) => {
        console.error('Error updating the response:', error);
    })

});



document.addEventListener('DOMContentLoaded', function() {
    const multilineInput = document.getElementById('multilineInput');

    // Function to adjust the height of the textarea
    function autoResize() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px'; 
    }

    multilineInput.addEventListener('input', autoResize);

    autoResize.call(multilineInput);
});


document.addEventListener('DOMContentLoaded', function() {
    const multilineInput = document.getElementById('multilineInput');
    const charCount = document.getElementById('charCount');

    // Function to update the character count
    function updateCharCount() {
        const charCountValue = multilineInput.value.length;
        if (charCountValue >= 300) {
            charCount.textContent = charCountValue + ' / 500';
            charCount.style.display = 'block'; 
        } else {
            charCount.style.display = 'none'; 
        }
    }


    multilineInput.addEventListener('input', updateCharCount);



    updateCharCount();
});

document.getElementById('ai_submit').addEventListener('click', function() {
    const textarea = document.getElementById('multilineInput');
    const text = textarea.value; 
    

    if (text === '') {
        alert('Please enter text in the textarea');
        return;
    } else {
        fetch('/ai_answer', {

            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ aiInput: text}),


        })
        .then(response => response.json())
        .then(data => {
            let answerElementValue= data[0];
            // console.log(answerElementValue)
            let randomFactValue = data[1];
            // console.log(randomFactValue)
            document.getElementById('ai_user_search').innerText = text;
            // delete_textarea();
            document.getElementById('ai__search').style.display = 'none';

            document.getElementById('ai__answer').innerText = answerElementValue;
            document.getElementById('ai_answer_list').style.display = "block";
            // RANDOM FACT
            document.getElementById('random__fact__label').style.display = "block";
            document.getElementById('random__fact').innerText = randomFactValue;
            document.getElementById('ai_update').addEventListener('click', function() {
                fetch('/ai_update', {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({responseText: text}),

                })
                .then(response => response.text())
                .then(data => {
                    document.getElementById('ai__answer').innerText = data;
            
                })
                .catch((error) => {
                    console.error('Error updating the response:', error);
                })});   

        })
        .catch((error) => {
            console.error('Error getting the response:', error);
        });       
    }

});
