const db = require("../util/database");

const Cart = require("./cart");

module.exports = class Product {
  // Creates product object in instances
  constructor(id, title, imageUrl, price, description) {
    this.id = id;
    this.title = title;
    this.imageUrl = imageUrl;
    this.price = price;
    this.description = description;
  }

  save() {
    return db.execute("INSERT INTO products (title, price, description, imageUrl) VALUES (?, ?, ?, ?)",
    [this.title, this.price, this.description, this.imageUrl])
  }

  static deleteById(id) {

  }

  // Asynchronous code!
  // Is called from controller
  static fetchAll() {
    return db.execute("SELECT * FROM products");
  }

  // Asynchronous code!
  // Gets one product by its id:
  static findById(id) {
    return db.execute("SELECT * FROM products WHERE products.id = ?", [id])
  }
};
