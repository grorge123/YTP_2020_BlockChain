
if (window.ethereum) {
    (async () => {
      if (await getAccount()) {
        location.href = "/works";
      }
    })();
}

$(document).ready(() => {
    $("#connect").on("click", async () => {
        if (await requestAccount()) {
            location.href = "/works";
        }
    })
    
    $("#continue").on("click", () => {
        location.href = "/works";
    })
})



