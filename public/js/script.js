document.addEventListener('DOMContentLoaded', function() {
    const showHistoryButton = document.getElementById('showHistoryButton');

    function showHistory() {
        const historyList = document.getElementById('historyList');
        historyList.style.display = 'block';

        const hideHistoryButton = document.createElement('button');
        hideHistoryButton.id = 'hideHistoryButton';
        hideHistoryButton.className = 'title__general';
        hideHistoryButton.textContent = "⤬";
        hideHistoryButton.addEventListener('click', hideHistory);

        // Add the button to the DOM but keep it invisible
        document.getElementById('historyContainer').appendChild(hideHistoryButton);

        // Use setTimeout to delay the opacity change, allowing the button to be added to the DOM first
        setTimeout(function() {
            hideHistoryButton.style.opacity = '1'; // Make the button visible
        }, 10); // Delay in milliseconds
    }

    function hideHistory() {
        const historyList = document.getElementById('historyList');
        historyList.style.display = 'none';

        const hideHistoryButton = document.getElementById('hideHistoryButton');
        hideHistoryButton.parentNode.removeChild(hideHistoryButton);
    }

    showHistoryButton.addEventListener('click', showHistory);
});

document.addEventListener('DOMContentLoaded', function() {
    const multilineInput = document.getElementById('multilineInput');

    // Function to adjust the height of the textarea
    function autoResize() {
        this.style.height = 'auto'; // Reset the height
        this.style.height = this.scrollHeight + 'px'; // Set the height to the scroll height
    }

    // Attach the autoResize function to the input event
    multilineInput.addEventListener('input', autoResize);

    // Call autoResize once to set the initial height
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
            charCount.style.display = 'block'; // Show the character count element
        } else {
            charCount.style.display = 'none'; // Hide the character count element
        }
    }

    // Attach the updateCharCount function to the input event
    multilineInput.addEventListener('input', updateCharCount);

    // Call updateCharCount once to set the initial character count
    updateCharCount();
});

document.getElementById('ai_submit').addEventListener('click', function() {
    const textarea = document.getElementById('multilineInput');
    const text = textarea.value; // Get the text from the textarea
    
    // Check if the text is empty
    if (text === '') {
        alert('Please enter text in the textarea');
        return;
    } else {
        // Send the text to the server
        fetch('/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ aiInput: text }),
        })
        .then(response => response.text())
        .then(data => {
            document.getElementById('ai_user_search').innerText = text;
            delete_textarea();
            var answerElement = document.getElementById('ai__answer');
            answerElement.innerHTML += `<span class="badge bg-primary mb-2">Joe</span><br>${data}`;
        })
        .catch((error) => {
            console.error('Error:', error);
        });       
    }

    function delete_textarea() {
        var label = document.getElementById('ai__search');
        label.remove();
    }

    
});