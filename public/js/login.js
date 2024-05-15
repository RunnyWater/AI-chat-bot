
document.addEventListener('DOMContentLoaded', function() {
    fetch('/check_login')
        .then(response => response.text())
        .then(data => {
            console.log(data)
            if (data === '0') {
                
            }else{
                window.location.href = "/";
            }
        })
        .catch((error) => {
            console.error('Error getting the response:', error);
        })
    });

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, password: password}),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data === 0) {
            window.location.href = "/";
        } else if (data === 1) {
            alert("Username or password is incorrect. Please try again.");
        } else {
            alert("An unknown error occurred.");
        }
    })
    .catch((error) => {
        console.error('Error getting the response:', error);
        
    });
});