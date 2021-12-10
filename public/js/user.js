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
