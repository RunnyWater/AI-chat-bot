var ID = '0'; // Guest number

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

    if (document.getElementById('id_user').value!==''){
        const id_textarea = document.getElementById('id_user');
        ID = id_textarea.value;
        fetch('/get_history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: ID }),
        })
        .then(response => response.json())
        .then(data => {
            delete_id_textarea();
            if (data == 0) {
                document.getElementById('history_label').innerHTML = "Please log in";
                return;
            }
            let questionHistoryHtml = '';
            data.forEach(item => {
                questionHistoryHtml += `<li class="history__items" ><button class="history__button" id="${item}">${item}</button></li>`;
            });
            let history = document.getElementById('question__div');
            history.innerHTML += questionHistoryHtml;
            data.forEach(item => {
                document.getElementById(item).addEventListener('click', function() {        
                    fetch('/get_answer', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ question: item, userId: ID }),
                    })
                    .then(response => response.json())
                    .then(data => {
                        let [text, answerElementValue, randomFactValue] = data;
                        
                        document.getElementById('ai_user_search').innerText = text;
                        // delete_textarea();
                        document.getElementById('ai__search').style.display = "none";
                        document.getElementById('ai__answer').innerText = answerElementValue;
                        document.getElementById('ai_answer_list').style.display = "block";
                        // RANDOM FACT
                        document.getElementById('random__fact__label').style.display = "block";
                        document.getElementById('random__fact').innerText = randomFactValue;
                        
                                })
                    .catch((error) => {
                        console.error('Error getting the response:', error);
                    })
    
                })
            })


        })
        .catch((error) => {
            console.error('Error getting the response:', error);
        });
    }

    // TODO: REMOVE AFTER INSTALLING NORMAL LOGIN

    function delete_id_textarea() {
        var id_area = document.getElementById('id_user');
        id_area.style.display = 'none';
        id_area.value = '';
    }

  
    function hideHistory() {
        const historyList = document.getElementById('historyList');
        historyList.style.display = 'none';

        const hideHistoryButton = document.getElementById('hideHistoryButton');
        hideHistoryButton.parentNode.removeChild(hideHistoryButton);
    }
});

document.getElementById('ai_update').addEventListener('click', function() {
    const textarea = document.getElementById('multilineInput');
    const text = textarea.value; 

    fetch('/ai_update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: ID, responseText: text}),
    })
    .then(response => response.text())
    .then(data => {
        document.getElementById('ai__answer').innerText = data;

    })
    .catch((error) => {
        console.error('Error updating the response:', error);
    })});



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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ aiInput: text, userId: ID }),


        })
        .then(response => response.json())
        .then(data => {
            let [answerElementValue, randomFactValue] = data;
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
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: ID, responseText: text}),

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
