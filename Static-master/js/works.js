
let w3;
let contract;
let role;
let deliverTimer = null;

const ETHERSCAN_TX_URL = "https://ropsten.etherscan.io/tx/";

const foodTitle = [
    '炒糖', '北蕉(香蕉)', '金桔麻糬餅'
];
const foodDescript = [
    '產出組織：8DTea \n\
    產出日期：2021-01-12 15:47:43\n\
    有效日期：2021-04-12\n\
    產出數量：20000毫升 (1鍋)\n\
    剩餘數量：17000毫升 (0.85鍋)\n\
    相關連結：https://fc.efoodex.net/portal.php?oid=148655&m=1',
    '產出組織：8DTea\n\
    產出日期：2021-01-28 15:11:17\n\
    有效日期：2021-04-25\n\
    產出數量：18公斤 (1箱)\n\
    剩餘數量：18公斤 (1箱)\n\
    相關連結：https://fc.efoodex.net/portal.php?oid=152263&m=1',
    '產出組織：宗泰食品\n\
    產出日期：2021-01-28 13:37:21\n\
    有效日期：2021-03-09\n\
    產出數量：272台斤 (272批)\n\
    剩餘數量：272台斤 (272批)\n\
    相關連結：https://fc.efoodex.net/portal.php?oid=152213&m=1'
];
const foodValue = [
    20, 30, 35
];

const foodSrc = [
    '../img/1667.jpg',
    '../img/8841.jpg',
    '../img/no.png'
]

const foodX = [10, 20, 50];
const foodY = [17, 91, 17];
$(document).ready(async function () {
    $("#searchInput").val("");

    const connected = await getAccount();
    if (connected) {
        // MetaMask is connected
        await checkNetwork();
        w3 = new Web3(window.ethereum);
        w3.eth.defaultAccount = acc;

        w3.eth.getBalance(acc, w3.eth.defaultBlock, (e, bal) => {
            $("#account").text(`${w3.utils.toChecksumAddress(acc)} with ${w3.utils.fromWei(bal, "ether")} ETH`);
        })
    } else {
        // Guest mode
        w3 = new Web3(new Web3.providers.WebsocketProvider(`wss://ropsten.infura.io/ws/v3/${infuraAPI}`))

        $("#account").text("");
        $(".guest").removeAttr("hidden");
    }

    contract = new w3.eth.Contract(await $.get(contractABI), contractAddress);

    const [roleResult] = await Promise.allSettled([getRoles()]);

    if (connected) {
        contract.methods.users(acc).call().then(users => {
            $("#gold").text(users.money);
            if (Number(users.UserType) === 2) {
                $('#mileage').text(users.mileage);
            } else {
                $('#mileage').text("你不是外送員!");
            }
        })

        role = roleResult.value;
    } else {
        role = "guest";
    }

    $.get('/food.json', (js) => {
        for (let i = 0; i < js.length; i++) {
            foodTitle.push(js[i]["foodTitle"])
            foodDescript.push(js[i]["foodDescript"])
            foodValue.push(js[i]["foodValue"])
            foodSrc.push(js[i]["foodSrc"])
            foodX.push(js[i]["foodX"])
            foodY.push(js[i]["foodY"])
        }
        updateList();
    })
})

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
    </template>
    `);
    const now = new Date();
    const deliverContainer = $("#deliverContainer");
    contract.methods.findwork(now.getTime()).call().then((workArray) => {
        let hasResult = false;
        workArray.forEach((index) => {
            if (index["user"] !== "0x0000000000000000000000000000000000000000") {
                const template = document.importNode(document.getElementById("deliverWorkTemplate").content, true);
                $("#itemName", template).text(`商品名稱：${index["name"]}`);
                $("#itemValue", template).text(`價格：${index["money"]}元`);
                $("#itemDest", template).text(`位置：(${index["To"].x},${index["To"].y})`);
                $("#button", template).html(`<button type="button" class="btn btn-secondary getWork" id="${index["cnt_num"]}">接單</button>`);
                deliverContainer.append(template);
                hasResult = true;
            }
        });
        if (hasResult) {
            $("#deliverloading").hide();
        } else {
            $("#deliverloadingTxt").text("No results :(");
            $("#deliverloading").show();
        }
    })
}

// Render the food list; customers additionally get an amount input and an order button.
function renderFoodCards(container, withOrderInput) {
    let hasResult = false;
    for (let i = 0; i < foodSrc.length; i++) {
        const template = document.importNode(document.getElementById("workTemplate").content, true);
        $("#title", template).text(foodTitle[i]);
        $("#desc", template).text(foodDescript[i]);
        $("#value", template).text(foodValue[i]);
        $("#value", template).append("元/每份餐點");
        $("#location", template).text(`位置：(${foodX[i]},${foodY[i]})`);
        if (withOrderInput) {
            $("#amount", template).html(`
            <div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="欲購買數量" aria-label="欲購買數量" aria-describedby="basic-addon2" id="food${i}">
                <div class="input-group-append">
                    <button class="buyItem btn btn-outline-secondary" type="button" id="buy${i}">下單</button>
                </div>
            </div>
            `);
        }
        $("#image", template).attr("src", foodSrc[i]);
        $(".onlycustomer", template).removeAttr("hidden");
        container.append(template);
        hasResult = true;
    }
    if (hasResult) {
        $("#loading").hide();
    } else {
        $("#loadingTxt").text("No results :(");
        $("#loading").show();
    }
}

function updateList() {
    const container = $("#worksContainer");
    container.find(".work").remove();
    if (role === "customer") {
        renderFoodCards(container, true);
        contract.methods.getbought(acc).call().then((deliverList) => {
            const listContainer = $("#deliverlist")
            deliverList.forEach((index) => {
                const template = document.importNode(document.getElementById("deliverlists").content, true);
                $("#orderID", template).text(index);
                contract.methods.FoodList(index).call().then((list) => {
                    $("#orderLocate", template).text(`(${list.From.x},${list.From.y})`);
                    $("#orderName", template).text(list.name);
                    $("#orderMoney", template).text(list.money);
                    if (!list.finish && list.get) {
                        $("#orderStatus", template).html(`
                        <button class="finishBuy btn btn-outline-secondary" type="button" id="${list.cnt_num}">完成</button>
                        `)
                    } else if (list.finish) {
                        $("#orderStatus", template).text("已完成")
                    } else {
                        $("#orderStatus", template).text("尚未接單")
                    }
                    listContainer.append(template);
                })

            })
        })
    } else if (role === "deliver") {
        contract.methods.users(acc).call().then((user) => {
            document.getElementById("nowLocation").innerHTML = `<h4 class="col md-2" id="nowLocation">現在位置：(${user.where.x},${user.where.y})</h4>`
        })
        update_deliver();
        // updateList runs on every search keystroke; keep a single polling timer.
        if (deliverTimer === null) {
            deliverTimer = setInterval(update_deliver, 10000);
        }
        contract.methods.getbought(acc).call().then((deliverList) => {
            const listContainer = $("#delivers-list")
            deliverList.forEach((index) => {
                contract.methods.getdeliver(index).call({ from: acc }).then((sendArray) => {
                    const template = document.importNode(document.getElementById("delivers-lists").content, true);
                    $("#deliverOrderID", template).text(index);
                    contract.methods.FoodList(index).call().then((list) => {
                        $("#deliverOrderLocate", template).text(`(${list.From.x},${list.From.y})`);
                        $("#deliverOrderName", template).text(list.name);
                        $("#deliverOrderMoney", template).text(list.money);
                        $("#deliverOrderStatus", template).html(`(${list.To.x},${list.To.y})`)
                        if (sendArray[sendArray.length - 1].toLowerCase() === acc.toLowerCase() && !list.finish) {
                            listContainer.append(template);
                        }
                    })
                })

            })
        })
    } else if (role === "guest") {
        renderFoodCards(container, false);
    }

}

async function getRoles() {
    let userRole;
    await contract.methods.users(acc).call().then((res) => {
        const userType = Number(res.UserType);
        if (userType === 0) {
            userRole = "guest";
            $("#role").text("guest");
            $("#scoring").text('非外送人員');
        } else if (userType === 1) {
            userRole = "customer";
            $("#role").text("customer");
            $("#scoring").text('非外送人員');
        } else if (userType === 2) {
            userRole = "deliver";
            $("#role").text("deliver");
            contract.methods.getbought(acc).call().then((bought) => {
                if (bought.length === 0) {
                    $("#scoring").text('尚未評分');
                } else {
                    $("#scoring").text(res.star / bought.length);
                }
            })
        }
    });
    return userRole;
}

function formatTime(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

function showPendingTx(hash) {
    $(Swal.getFooter()).html(`<div style="text-align: center;"><a>Your transaction is being processed...</a><br><a href="${ETHERSCAN_TX_URL}${hash}">View transaction on Etherscan</a></div>`).attr("style", "display: flex;")
}

function showTxSuccess(receipt, text) {
    Swal.fire({
        icon: 'success',
        text: text,
        footer: `<a href="${ETHERSCAN_TX_URL}${receipt.transactionHash}">View transaction on Etherscan</a>`
    }).then(() => {
        location.href = "/works"
    })
}

function showTxError(err, cancelMessage) {
    console.error(err);
    if (err.code === 4001) { // User denied
        Swal.showValidationMessage(cancelMessage)
    } else {
        Swal.showValidationMessage(
            "交易失敗!!!<br>View transaction on Etherscan for details"
        )
        Swal.fire({
            icon: 'error',
            text: '交易失敗!!',
            footer: `<a href="${ETHERSCAN_TX_URL}${err.transactionHash}">View on Etherscan for more details</a>`
        })
    }
}

$(document).on("click", ({ target }) => {
    if ($(target).hasClass("buyItem")) {
        const today = new Date();
        const itembuy = parseInt(target.id.slice(3), 10);
        const itemnumber = parseInt(document.getElementById(`food${itembuy}`).value, 10);
        if (!(itemnumber > 0)) {
            Swal.fire({
                icon: "error",
                title: "訂單狀況",
                text: "請輸入正確的購買數量"
            });
            return;
        }
        const cost = foodValue[itembuy] * itemnumber;
        Swal.fire({
            icon: "question",
            title: "訂單狀況",
            text: `正在下訂${foodTitle[itembuy]}，下訂時間：${formatTime(today)}訂單金額：${cost}元，請等待交易`
        });

        contract.methods.users(acc).call().then((user) => {
            contract.methods.buildFood(foodX[itembuy], foodY[itembuy], user.where.x, user.where.y, cost, today.getTime(), foodTitle[itembuy]).send({
                from: acc
            })
                .once('transactionHash', showPendingTx)
                .then((receipt) => showTxSuccess(receipt, '訂單成功建立'))
                .catch((err) => showTxError(err, "你取消了此筆訂單"));
        })

    } else if ($(target).hasClass("getWork")) {
        Swal.fire({
            icon: "question",
            title: "訂單狀況",
            text: `正在接單，單號：${target.id}，下訂時間：${formatTime(new Date())}，請等待交易`
        });

        contract.methods.getwork(target.id).send({
            from: acc
        }).catch((err) => showTxError(err, "你取消了接單"));
    } else if ($(target).hasClass("finishBuy")) {
        const id = target.id;
        Swal.fire({
            title: '你對於此筆訂單之評分',
            icon: 'question',
            input: 'range',
            inputLabel: 'scoring',
            inputAttributes: {
                min: 0,
                max: 5,
                step: 1
            },
            inputValue: 5
        }).then((rating) => {
            if (!rating.isConfirmed) return;
            contract.methods.finish(id, rating.value).send({
                from: acc
            })
                .once('transactionHash', showPendingTx)
                .then((receipt) => showTxSuccess(receipt, '訂單成功完成'))
                .catch((err) => showTxError(err, "你取消完成"));
        })
    } else if ($(target).hasClass("translate")) {
        Swal.fire({
            title: '輸入上一個外送員之名稱',
            input: 'text',
            inputPlaceholder: '上一個外送員',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return '你需要輸入值'
                }
            }
        }).then((nextAddress) => {
            if (!nextAddress.isConfirmed) return;
            Swal.fire({
                title: '輸入轉單編號',
                input: 'text',
                inputPlaceholder: '編號',
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value) {
                        return '你需要輸入值'
                    }
                }
            }).then((orderId) => {
                if (!orderId.isConfirmed) return;
                contract.methods.users(acc).call().then((user) => {
                    contract.methods.transorder(nextAddress.value, orderId.value, user.where.x, user.where.y).send({ from: acc })
                        .catch((err) => console.error(err));
                })
            })
        })
    } else if ($(target).hasClass("updateLocation")) {
        Swal.fire({
            title: '手動輸入X與Y',
            html:
                `<h3>X座標</h3><input id="swal-input1" class="swal2-input"><br><h3>Y座標</h3><input id="swal-input2" class="swal2-input">`,
            focusConfirm: false,
            preConfirm: () => {
                return [
                    document.getElementById('swal-input1').value,
                    document.getElementById('swal-input2').value
                ]
            }
        }).then((locate) => {
            if (!locate.isConfirmed) return;
            const x = parseInt(locate.value[0], 10);
            const y = parseInt(locate.value[1], 10);

            contract.methods.updateXY(x, y).send({ from: acc })
                .catch((err) => console.error(err));

        })
    }
})

$("#connect").on("click", async () => {
    if (await requestAccount()) {
        location.reload();
    }
})

$("#searchInput").on("input", () => {
    updateList();
})

$(window).on("hashchange", () => {
    location.reload();
})
