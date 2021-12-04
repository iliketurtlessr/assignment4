
/**
 * Sends new user login credentials to register
 */
function register() {

    let user = {
        "username": document.getElementById("newUsername").value,
        "password": document.getElementById("newPassword").value,
    }
    
    let req = new XMLHttpRequest();
    req.open("POST", `http://localhost:3000/registration`);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(user));
    req.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 201) {
                let oid = JSON.parse(this.responseText)
                alert("Registration Successful!");
                window.location.href = `http://localhost:3000/users/${oid}`;
            }
            if (this.status === 400) alert(this.responseText);
        }
    };
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
    req.open("POST", `http://localhost:3000/login`);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(user));
    req.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) 
                window.location.href = `http://localhost:3000/`;
            if (this.status === 400 || this.status === 404)
                alert(this.responseText);
        }
    };
}
