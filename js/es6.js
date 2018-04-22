try {
    new Function("(x) => { return x + 1 }");
} catch(err) {
    alert("Your browser don't support ES6, in other means, you must update it to keep using our technology.");
}