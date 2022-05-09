class Order {
    constructor(action, price, quantity, account) {
        if (action.toLowerCase() != 'sell' && action.toLowerCase() != 'buy') {
            throw 'Action must be either buy or sell';
        }
        if (price <= 0 || price > 500000) {
            throw 'Price must be greater than 0 and less than 500,000';
        }
        if (quantity <= 0 || quantity > 1000) {
            throw 'Quantity must be greater than 0 and less than 1000';
        }
        if (account <= 100000 || account > 999999) {
            throw 'Please use a valid account number';
        }
        this.action = action;
        this.price = price;
        this.quantity = quantity;
        this.account = account;
        this.time = new Date().toLocaleString();
    }
}

class AggregateEntry {
    constructor(asks, pricePoint, bids) {
        if (pricePoint <= 0 || pricePoint > 500000) {
            throw 'Price must be greater than 0 and less than 500,000';
        }
        if (asks < 0 || asks > 1000) {
            throw 'Quantity must be greater than 0 and less than 1000';
        }
        if (bids < 0 || bids > 1000) {
            throw 'Quantity must be greater than 0 and less than 1000';
        }
        this.asks = asks;
        this.pricePoint = pricePoint;
        this.bids = bids;
    }
}


const sellOrders = []; //array of all sell orders
const buyOrders = []; //array of all buy orders
const tradeHistory = []; //array of strings representing trade history

function compareSellOrders(orderA, orderB) { //compare Sell orders to support order sorting from highest to lowest price
    if (orderA.price == orderB.price) {
        return orderB.time - orderA.time;
    }
    return orderB.price - orderA.price;
}

function compareBuyOrders(orderA, orderB) { //compare BUY orders to support order sorting from lowest to highest price
    if (orderA.price == orderB.price) {
        return orderB.time - orderA.time;
    }
    return orderA.price - orderB.price;
}

function createOrder(action, price, quantity, account) {
    if (action.toLowerCase() != 'sell' && action.toLowerCase() != 'buy') {
        throw 'Action must be either buy or sell';
    }
    if (price <= 0 || price > 500000) {
        throw 'Price must be greater than 0 and less than 500,000';
    }
    if (quantity <= 0 || quantity > 1000) {
        throw 'Quantity must be greater than 0 and less than 1000';
    }
    if (account <= 100000 || account > 999999) {
        throw 'Please use a valid account number';
    }
    let newOrder = new Order(action, price, quantity, account);
    if (newOrder.action == "sell" && buyOrders.length == 0) {
        addOrder(newOrder);
    } else if (newOrder.action == "buy" && sellOrders.length == 0) {
        addOrder(newOrder);
    } else {
        matchOrder(newOrder);
    }
}

function removeOrders() {
    for (let i = 0; i < buyOrders.length; i++) {
        if (buyOrders[i].quantity == 0) {
            buyOrders.splice(i, 1);
        }
    }
    for (let i = 0; i < sellOrders.length; i++) {
        if (sellOrders[i].quantity == 0) {
            sellOrders.splice(i, 1);
        }
    }
}

function matchOrder(newOrder) {
    if (!(newOrder instanceof Order)) {
        throw 'Only order objects can be used to make a trade';
    }
    if (newOrder.action == "sell") { //check action of new order, iterate through opposite list
        for (let i = 0; i < buyOrders.length; i++) { //search buy list for highest buy order above sell price
            if (newOrder.price <= buyOrders[i].price) {
                trade(newOrder, buyOrders[i]);
            }
        }
        addOrder(newOrder)
    } else {
        for (let i = 0; i < sellOrders.length; i++) { //search sell list for lowest sell order below buy price
            if (newOrder.price >= sellOrders[i].price) {
                trade(sellOrders[i], newOrder);
            }
        }
        addOrder(newOrder);
    }
}

function trade(sellOrder, buyOrder) { //take a sell order and a buy order and return the order which has quantity remaining
    if (!(sellOrder instanceof Order) || !(buyOrder instanceof Order)) {
        throw 'Only order objects can be used to make a trade';
    }
    if (sellOrder.quantity - buyOrder.quantity < 0) { //buyorder is larger than sellorder
        addHistory(sellOrder)
        buyOrder.quantity -= sellOrder.quantity;
        sellOrder.quantity = 0;
    } else { //sellorder is larger than buyorder
        addHistory(buyOrder)
        sellOrder.quantity -= buyOrder.quantity;
        buyOrder.quantity = 0;
    }
}

function addHistory(order) {
    if (order.quantity > 0) {
        historyString = order.quantity + " MONEYCOINS sold for " + order.price;
        tradeHistory.push(historyString);
    }
}

function addOrder(order) {
    if (!(order instanceof Order)) {
        throw 'Only order objects can be added to the orderbook';
    }
    if (order.action == "sell") {
        let list = sellOrders;
        list.push(order);
        list.sort(compareSellOrders);
    } else {
        let list = buyOrders;
        list.push(order);
        list.sort(compareBuyOrders);
    }
    removeOrders();
    console.table(buyOrders);
    console.table(sellOrders);
}

// lowest ask is always higher than highest bid 

function getAggregateOrders() {
    let aggregateOrders = [];
    let price = 0;
    let qty = 0;
    let asks = sellOrders;
    let bids = buyOrders;
    for (let i = 0; i < asks.length; i++) {
        price = asks[i].price;
        qty += asks[i].quantity;
        if (i == asks.length - 1) {
            aggregateOrders.push(new AggregateEntry(qty, price, 0));
            qty = 0;
        } else if ((asks[i].price) == asks[i + 1].price) {
            continue;
        } else {
            aggregateOrders.push(new AggregateEntry(qty, price, 0));
            qty = 0;
        }
    }
    bids.sort(compareSellOrders);
    for (let i = 0; i < bids.length; i++) {
        price = bids[i].price;
        qty += bids[i].quantity;
        if (i == bids.length - 1) {
            aggregateOrders.push(new AggregateEntry(0, price, qty));
            qty = 0;
        } else if ((bids[i].price) == (bids[i + 1].price)) {
            continue;
        } else {
            aggregateOrders.push(new AggregateEntry(0, price, qty));
            qty = 0;
        }
    }
    return aggregateOrders;
}

function getPrivateOrders(account) {
    let privateOrders = [];
    let asks = sellOrders;
    let bids = buyOrders;
    for (let i = 0; i < asks.length; i++) {
        if (account === asks[i].account) {
            privateOrders.push(asks[i])
        }
    }
    for (let i = 0; i < bids.length; i++) {
        if (account === bids[i].account) {
            privateOrders.push(bids[i])
        }
    }
    privateOrders.sort(compareSellOrders);
    return privateOrders;
};

module.exports = {
    Order,
    sellOrders,
    buyOrders,
    tradeHistory,
    compareSellOrders,
    compareBuyOrders,
    createOrder,
    removeOrders,
    matchOrder,
    trade,
    addOrder,
    getAggregateOrders,
    getPrivateOrders
}
