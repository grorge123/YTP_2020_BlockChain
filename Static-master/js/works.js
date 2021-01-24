
const colors = [
    "primary",
    "secondary",
    "success",
    "danger",
    "warning",
    "info",
    "light",
    "dark",
]

var foodTitle = [
    '蘋果', '西瓜', '永和米漿'
];
var foodDescript = [
    '又大又紅的蘋果，看起來好像很好吃的樣子',
    '一顆圓圓的西瓜，就這樣',
    '絕對不是業配，目前絕對不是'
];
var foodValue = [
    20, 30, 76
];

var foodSrc = [
    '../img/apple.png',
    '../img/watermelon.png',
    '../img/ricedrink.png'
]

var foodX = [10, 20, 50];
var foodY = [17, 91, 17];
$(document).ready(async function () {
    $("#searchInput").val("");

    w3 = new Web3(window.ethereum);

    if (await getAccount()) {
        // MetaMask is connected
        await checkNetwork();
        w3 = new Web3(window.ethereum);
        w3.eth.defaultAccount = acc;
        logged_in = true;

        w3.eth.getBalance(acc, w3.eth.defaultBlock, (e, bal) => {
            $("#account").text(`${w3.utils.toChecksumAddress(acc)} with ${w3.utils.fromWei(bal, "ether")} ETH`);
        })
    } else {
        // Guest mode
        w3 = new Web3(new Web3.providers.WebsocketProvider(`wss://ropsten.infura.io/ws/v3/${infuraAPI}`))
        logged_in = false;

        $("#account").text("");
        $(".guest").removeAttr("hidden");
    }

    contract = new w3.eth.Contract(await $.get(contractABI), contractAddress);
    // console.log(contract);

    res = await Promise.allSettled([
        getRoles(),
        getWorksData(),
        getRated(),
        getCategories()
    ]);
    if (await getAccount()) {
        contract.methods.users(acc).call().then(users => {
            money = users.money;
            $("#gold").text(money);
        })

        role = res[0].value;
        updateList();
    } else {
        role = "guest";
        updateList();
    }
})
let deliverhasResult = false;
function update_deliver() {
    $("#deliverContainer").html(`
    <br>
    <div class="col-md" id="deliverloading">
    <h3 id="deliverloadingTxt">Loading...</h3>
    </div>
    
    <template id="deliverWorkTemplate">
    <div class="col-md-4 work">
    <div class="card mb-4 box-shadow">
    <div class="card-body">
    <h5 class="card-text" id="itemName"></h5>
    <h5 class="card-text" id="itemValue"></h5>
    <h5 class="card-text" id="itemDest"></h5>
    <div class="card-text" id="button"></div>
    </div>
    </div>
    </div>
    </div>
    </template>
    `);
    var now = new Date();
    const deliverContainer = $("#deliverContainer");
    contract.methods.findwork(now.getTime()).call().then((workArray) => {
        workArray.forEach((index) => {
            if (index["user"] != "0x0000000000000000000000000000000000000000") {
                const template = document.importNode(document.getElementById("deliverWorkTemplate").content, true);
                $("#itemName", template).text(index["name"]);
                //console.log(index["money"]);
                $("#itemValue", template).text(`${index["money"]}元`);
                $("#itemDest", template).text(`(${index["To"].x},${index["To"].y})`);
                $("#button", template).html(`<button type="button" class="btn btn-secondary getWork" id="${index["cnt_num"]}">接單</button>`);
                deliverContainer.append(template);
                deliverhasResult = true;
            }
        });
        $("#deliverloading").hide();
        if (!deliverhasResult) {
            $("#deliverloadingTxt").text("No results :(");
            $("#deliverloading").show();
        } else {
            $("#deliverloading").hide();
            // Disable rated buttons
            if (role == 'rater') {
                rated.forEach((id) => {
                    $(`.rateBtn[work-id='${id}']`).text("Rated").attr("disabled", true);
                })
            }
        }
    })
}

function updateList(search) {
    const my = window.location.hash.split("#")[1] == "my";
    const container = $("#worksContainer");
    container.find(".work").remove();

    let hasResult = false;
    if (role == "customer") {
        for (var i = 0; i < 3; i++) {
            const template = document.importNode(document.getElementById("workTemplate").content, true);
            $("#title", template).text(foodTitle[i]);
            $("#desc", template).text(foodDescript[i]);
            $("#value", template).text(foodValue[i]);
            $("#value", template).append("元/每份餐點");
            var locate = `位置：(${foodX[i]},${foodY[i]})`;
            $("#location", template).text(locate);
            $("#amount", template).html(`
            <div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="欲購買數量" aria-label="欲購買數量" aria-describedby="basic-addon2" id="food${i}">
                <div class="input-group-append">
                    <button class="buyItem btn btn-outline-secondary" type="button" id="buy${i}">下單</button>
                </div>
            </div>
            `);
            $("#image", template).attr("src", foodSrc[i]);
            $(".onlycustomer", template).removeAttr("hidden");
            container.append(template);
            hasResult = true;
        }
        if (!hasResult) {
            $("#loadingTxt").text("No results :(");
            $("#loading").show();
        } else {
            $("#loading").hide();
            // Disable rated buttons
            if (role == 'rater') {
                rated.forEach((id) => {
                    $(`.rateBtn[work-id='${id}']`).text("Rated").attr("disabled", true);
                })
            }
        }
        contract.methods.getbought(acc).call().then((deliverList) => {
            const container = $("#deliverlist")
            // List = Object.value(deliverList);
            deliverList.forEach((index) => {
                const template = document.importNode(document.getElementById("deliverlists").content, true);
                $("#orderID", template).text(index);
                contract.methods.FoodList(index).call().then((list) => {
                    var nowx = list.From.x;
                    var nowy = list.From.y;
                    $("#orderLocate", template).text(`(${nowx},${nowy})`);
                    $("#orderName", template).text(list.name);
                    $("#orderMoney", template).text(list.money);
                    if (list.finish != true && list.get == true) {
                        $("#orderStatus", template).html(`
                        <button class="finishBuy btn btn-outline-secondary" type="button" id="${list.cnt_num}">完成</button>
                        `)
                    } else if (list.finish) {
                        $("#orderStatus", template).text("已完成")
                    } else if (!list.get) {
                        $("#orderStatus", template).text("尚未接單")
                    }
                    container.append(template);
                })

            })
        })
    } else if (role == "deliver") {
        update_deliver();
        setInterval(
            update_deliver
            , 10000);
        contract.methods.getbought(acc).call().then((deliverList) => {
            const container = $("#delivers-list")
            // List = Object.value(deliverList);
            deliverList.forEach((index) => {
                contract.methods.getdeliver(index).call({ from: acc }).then((sendArray) => {
                    console.log(sendArray[sendArray.length - 1].toLowerCase(), acc.toLowerCase())
                    const template = document.importNode(document.getElementById("delivers-lists").content, true);
                    $("#deliverOrderID", template).text(index);
                    contract.methods.FoodList(index).call().then((list) => {
                        var nowx = list.From.x;
                        var nowy = list.From.y;
                        $("#deliverOrderLocate", template).text(`(${nowx},${nowy})`);
                        $("#deliverOrderName", template).text(list.name);
                        $("#deliverOrderMoney", template).text(list.money);
                        if (list.finish != true && list.get == true) {
                            $("#deliverOrderStatus", template).html(`
                                <button class="translate btn btn-outline-secondary" type="button" id="${list.cnt_num}">轉單</button>
                                `)
                        }
                        if (sendArray[sendArray.length - 1].toLowerCase() == acc.toLowerCase() && !list.finish) {
                            container.append(template);
                        }
                    })
                })

            })
        })
    } else if (role == "guest") {
        for (var i = 0; i < 3; i++) {
            const template = document.importNode(document.getElementById("workTemplate").content, true);
            $("#title", template).text(foodTitle[i]);
            $("#desc", template).text(foodDescript[i]);
            $("#value", template).text(foodValue[i]);
            $("#value", template).append("元/每份餐點");
            var locate = `位置：(${foodX[i]},${foodY[i]})`;
            $("#location", template).text(locate);

            $("#image", template).attr("src", foodSrc[i]);
            $(".onlycustomer", template).removeAttr("hidden");
            container.append(template);
            hasResult = true;
        }
        if (!hasResult) {
            $("#loadingTxt").text("No results :(");
            $("#loading").show();
        } else {
            $("#loading").hide();
            // Disable rated buttons

        }
    }

}

async function getRoles() {
    var role;
    await contract.methods.users(acc).call().then((res) => {
        if (res.UserType == 1) {
            role = "customer";
            $("#role").text("customer");
        } else if (res.UserType == 2) {
            role = "deliver";
            $("#role").text("deliver");
        }
    });
    return role;
}

async function getWorksData() {
    const works = [];

    const count = await contract.methods.workCount().call();

    const promises = []
    for (let i = 0; i < count; i++) {
        promises.push(
            (async () => {
                let work;
                await contract.methods.works(i).call().then(async (w) => {
                    if (w.exists) {
                        ratings = await contract.methods.getRatings(i).call();
                        w["ratings"] = ratings;
                        w["rating"] = ratings[0].length ? (ratings[0].reduce((a, b) => parseInt(a) + parseInt(b))) / ratings[0].length : -1;
                        w["id"] = i;
                        //
                        if (i <= 7) {
                            let category = 0;
                            if (w["categories"] & 1) {
                                category |= 2;
                            }
                            if (w["categories"] & 2) {
                                category |= 16;
                            }
                            w["categories"] = category;
                        }
                        //
                        work = w;
                    }
                })
                return work;
            })()
        )
    }
    const res = await Promise.allSettled(promises);
    res.forEach((promise) => {
        works[promise.value.id] = promise.value;
    })
    //
    works[4]["desc"] = works[4]["desc"].split("https")[0];
    //
    return works;
}

async function getRated() {
    return await contract.methods.ratedWorks(acc).call();
}

async function getCategories() {
    return await contract.methods.getCategories().call();
}

$(document).on("click", ({ target }) => {
    if ($(target).hasClass("buyItem")) {
        var today = new Date();
        var buytime = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
        var itembuy = parseInt(target.id[3]);
        var foodid = "food" + itembuy;
        var itemnumber = parseInt(document.getElementById(foodid).value);
        var cost = foodValue[itembuy] * itemnumber;
        Swal.fire({
            icon: "question",
            title: "訂單狀況",
            text: `正在下訂${foodTitle[itembuy]}，下訂時間：${buytime}訂單金額：${cost}元，請等待交易`
        });

        contract.methods.users(acc).call().then((user) => {
            var userx = user.where.x;
            var usery = user.where.y;
            contract.methods.buildFood(foodX[itembuy], foodY[itembuy], userx, usery, cost, today.getTime(), foodTitle[itembuy]).send({
                from: acc
            })
                .once('transactionHash', (hash) => {
                    $(Swal.getFooter()).html(`<div style="text-align: center;"><a>Your trasaction is being processed...</a><br><a href="https://ropsten.etherscan.io/tx/${hash}">View transaction on Etherscan</a></div>`).attr("style", "display: flex;")
                })
                .then((receipt) => {
                    console.log(receipt)
                    Swal.fire({
                        icon: 'success',
                        text: '訂單成功建立',
                        footer: `<a href="https://ropsten.etherscan.io/tx/${receipt.transactionHash}">View transaction on Etherscan</a>`
                    }).then(() => {
                        location.href = "/works"
                    })
                })
                .catch((err) => {
                    console.log(err);
                    if (err.code == 4001) { // User denied
                        Swal.showValidationMessage(
                            "你取消了此筆訂單"
                        )
                    } else {
                        Swal.showValidationMessage(
                            "交易失敗!!!<br>View transaction on Etherscan for details"
                        )
                        Swal.fire({
                            icon: 'error',
                            text: '交易失敗!!',
                            footer: `<a href="https://ropsten.etherscan.io/tx/${err.transactionHash}">View on Etherscan for more details</a>`
                        })
                    }
                });
        })

    } else if ($(target).hasClass("getWork")) {
        var id = target.id;
        var today = new Date();
        var gettime = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

        Swal.fire({
            icon: "question",
            title: "訂單狀況",
            text: `正在接單，單號：${target.id}，下訂時間：${gettime}，請等待交易`
        });

        contract.methods.getwork(id).send({
            from: acc
        });
    } else if ($(target).hasClass("finishBuy")) {
        var id = target.id;
        contract.methods.finish(id).send({
            from: acc
        })
            .once('transactionHash', (hash) => {
                $(Swal.getFooter()).html(`<div style="text-align: center;"><a>Your trasaction is being processed...</a><br><a href="https://ropsten.etherscan.io/tx/${hash}">View transaction on Etherscan</a></div>`).attr("style", "display: flex;")
            })
            .then((receipt) => {
                console.log(receipt)
                Swal.fire({
                    icon: 'success',
                    text: '訂單成功完成',
                    footer: `<a href="https://ropsten.etherscan.io/tx/${receipt.transactionHash}">View transaction on Etherscan</a>`
                }).then(() => {
                    location.href = "/works"
                })
            })
            .catch((err) => {
                console.log(err);
                if (err.code == 4001) { // User denied
                    Swal.showValidationMessage(
                        "你取消完成"
                    )
                } else {
                    Swal.showValidationMessage(
                        "交易失敗!!!<br>View transaction on Etherscan for details"
                    )
                    Swal.fire({
                        icon: 'error',
                        text: '交易失敗!!',
                        footer: `<a href="https://ropsten.etherscan.io/tx/${err.transactionHash}">View on Etherscan for more details</a>`
                    })
                }
            });
    }
})

function rate(id) {
    if (rater_disabled) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Your rating privilege is disabled!'
        })
        return;
    }
    Swal.fire({
        title: 'How would you rate?',
        icon: 'question',
        input: 'range',
        inputAttributes: {
            min: 1,
            max: 10,
            step: 1
        },
        inputValue: 5,
        showLoaderOnConfirm: true,
        confirmButtonText: 'Rate!',
        showCancelButton: true,
        allowOutsideClick: () => !Swal.isLoading(),
        allowEscapeKey: () => !Swal.isLoading(),
        preConfirm: (value) => {
            $(Swal.getInput()).attr("disabled", true)
            return contract.methods.rateWork(id, value).send({
                from: acc
            })
                .once('transactionHash', (hash) => {
                    $(Swal.getFooter()).html(`<div style="text-align: center;"><a>Your trasaction is being processed...</a><br><a href="https://ropsten.etherscan.io/tx/${hash}">View transaction on Etherscan</a></div>`).attr("style", "display: flex;")
                })
                .then((receipt) => {
                    console.log(receipt)
                    Swal.fire({
                        icon: 'success',
                        text: 'Rating sent!',
                        footer: `<a href="https://ropsten.etherscan.io/tx/${receipt.transactionHash}">View transaction on Etherscan</a>`
                    }).then(() => {
                        location.reload();
                    })
                })
                .catch((err) => {
                    console.log(err);
                    if (err.code == 4001) { // User denied
                        Swal.showValidationMessage(
                            "You canceled the transaction!"
                        )
                    } else {
                        Swal.showValidationMessage(
                            "Transaction failed!!<br>View transaction on Etherscan for details"
                        )
                        Swal.fire({
                            icon: 'error',
                            text: 'Transaction failed!!',
                            footer: `<a href="https://ropsten.etherscan.io/tx/${err.transactionHash}">View on Etherscan for more details</a>`
                        })
                    }

                })
        }
    })
}

$("#connect").on("click", async (e) => {
    if (await requestAccount()) {
        location.reload();
    }
})

$("#searchInput").on("input", ({ target }) => {
    updateList($(target).val());
})

$(window).on("hashchange", () => {
    location.reload();
})

function exportWorks() {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(works));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "works.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
