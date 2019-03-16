const express = require('express');
const exphdlbr = require('express-handlebars');
const redis = require('redis');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

const port = 8000;

const app = express();
const redisclient = redis.createClient();
redisclient.on("connect", () => {
    console.log('Redis connected successfully !!!');
})

app.engine("handlebars", exphdlbr({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

//body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(methodOverride('_method'));

//Route handler for home page
app.get('/', (req, res, next) => {
    res.render('searchusers');
});

//Route handler for getting data from Redic cache, when user search
app.post("/user/search", (req, res, next) => {
    console.log('URL was invoked ');

    const userid = req.body.id;
    redisclient.hgetall(userid, (err, data) => {
        // console.log(' Response from service is ', data);
        if (!data) {
            res.render('searchusers', {
                error: 'User not found with id'
            });
        } else {
            data.id = userid;
            return res.render('userdetails', {
                user: data
            });
        }
    });
});

//Route to show add user page
app.get('/user/add', (req, res, next) => {
    res.render('adduser');
});

//Route to add new user info to Redis
app.post('/user/add', (req, res, next) => {
    const id = req.body.id;
    const firstName = req.body.first_name;
    const lastName = req.body.last_name;
    const email = req.body.email;
    const phone = req.body.phone;

    redisclient.hmset(id,
        [
            'first_name', firstName,
            'last_name', lastName,
            'email', email,
            'phone', phone
        ], (err, data) => {
            if (err) {
                console.log(' Error occured setting data in Redis');
            } else {
                res.redirect("/");
            }
        })
});

//Route to delete user from Redis cache
app.delete("/user/delete/:id", (req, res, next) => {
    redisclient.del(req.params.id, (err, data) => {
        res.redirect("/");
    });
});

app.listen(port, () => {
    console.log('Application started at port ', port);
});