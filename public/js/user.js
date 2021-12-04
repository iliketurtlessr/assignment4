console.log(ownPage);
// display user's privacy if viewing their own profile
if (ownPage) {
    if (user.privacy) document.getElementById('private').checked = true;
    else document.getElementById('public').checked = true;
}
function update() {

    // Get user's preference of privacy is selected
    let option;
    if (document.getElementById('private').checked) option = true;
    else option = false;

    let req = new XMLHttpRequest();
    req.open("PUT", window.location.href);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({"privacy": option}));
    req.onreadystatechange = function() {
        if (req.readyState === 4 && req.status === 200)
            window.location.href = window.location.href;
    };
}
