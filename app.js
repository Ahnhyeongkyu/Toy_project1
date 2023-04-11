const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Connect mongodb
main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect(
        "mongodb+srv://admin-An:10-72001184qw@cluster0.onpudap.mongodb.net/todolistDB"
    );
    console.log("Server connect");
}

const itemsSchema = {
    name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "exercise",
});

const item2 = new Item({
    name: "study",
});

const item3 = new Item({
    name: "work",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    Item.find({})
        .then((foundItems) => {
            if (foundItems.length === 0) {
                Item.insertMany(defaultItems)
                    .then((result) => {
                        console.log(
                            result + "Successfully saved default items to DB."
                        );
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                res.redirect("/");
            } else {
                res.render("list", {
                    listTitle: "Today",
                    newListItems: foundItems,
                });
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName })
        .then((foundList) => {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });
                list.save();

                res.redirect("/" + customListName);
            } else {
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items,
                });
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item({
        name: itemName,
    });

    if (listName === "Today") {
        newItem.save();

        res.redirect("/");
    } else {
        List.findOne({ name: listName }).then((foundList) => {
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId)
            .then((result) => {
                console.log(result + "Successfully deleted checked item.");
                res.redirect("/");
            })
            .catch((err) => {
                console.log(err);
            });
    } else {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemId } } }
        ).then((foundList) => {
            res.redirect("/" + listName);
        });
    }
});

app.get("/about", function (req, res) {
    res.render("about");
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});
