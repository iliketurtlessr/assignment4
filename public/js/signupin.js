
/**
 * Sends new user login credentials to register
 */
function register() {

    let user = {
        "username": document.getElementById("newUsername").value,
        "password": document.getElementById("newPassword").value,
    }
    
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState === 4 && req.status === 201) {
            let oid = JSON.parse(this.responseText)
            alert("Registration Successful!");
            window.location.href = `http://localhost:3000/users/${oid}`;
        }
        if (req.readyState === 4 &&  req.status === 400) {           
            alert(this.responseText);
        }
    };
    req.open("POST", `http://localhost:3000/registration`);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(user));
}

/**
 * Sends entered credentials to log user in
 */
function login() {

    let user = {
        "username": document.getElementById("username").value,
        "password": document.getElementById("password").value,
    }
    
    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState === 4 && req.status === 200) {
            window.location.href = `http://localhost:3000/`;
        }
        if (req.readyState === 4 && (req.status === 400 || req.status === 404)) {
            alert(this.responseText);
        }
    };
    req.open("POST", `http://localhost:3000/login`);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(user));
}
