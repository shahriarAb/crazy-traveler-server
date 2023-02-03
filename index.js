const { MongoClient } = require("mongodb");
const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;

const port = process.env.PORT || 5500;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8cjcg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
});

//token varification and authorization
const verifyJWToken = (req, res, next) => {
   const authHeader = req.headers.authorization;
   if (!authHeader) {
      return res.status(401).send({ message: "UnAuthorized Access!!" });
   }
   const token = authHeader.split(" ")[1];
   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decode) {
      if (err) {
         return res.status(403).send({ message: "Forbidden access!!" });
      }
      req.decode = decode;
      next();
   });
};

async function run() {
   try {
      await client.connect();
      const database = client.db("travelInfo");
      const placeCollection = database.collection("destinations");
      const bookingCollection = database.collection("bookings");
      const usersCollection = database.collection("users");
      const reviewsCollection = database.collection("reviews");

      //PUT api for users with JWT
      app.put("/user/:email", async (req, res) => {
         const email = req.params.email;
         const user = req.body;
         const filter = { email: email };
         const options = { upsert: true };
         const updateDoc = {
            $set: user,
         };
         const result = await usersCollection.updateOne(
            filter,
            updateDoc,
            options
         );
         //setting up the json web token(JWT)
         const token = jwt.sign(
            { email: email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "1h" }
         );
         res.send({ result, token });
      });

      // GET api to load all users
      app.get("/users", verifyJWToken, async (req, res) => {
         const users = await usersCollection.find().toArray();
         res.send(users);
      });

      //make some user admin
      app.put("/user/admin/:email", async (req, res) => {
         const email = req.params.email;
         const filter = { email: email };
         const updateDoc = {
            $set: { role: "admin" },
         };
         const result = await usersCollection.updateOne(filter, updateDoc);
         res.send(result);
      });

      //GET api to check a user is admin or not
      app.get("/admin/:email", async (req, res) => {
         const email = req.params.email;
         const user = await usersCollection.findOne({ email: email });
         const isAdmin = user.role === "admin";
         res.send({ admin: isAdmin });
      });

      //POST api
      app.post("/destinations", async (req, res) => {
         const newDestination = req.body;
         const result = await placeCollection.insertOne(newDestination);
         res.json(result);
      });

      //GET api
      app.get("/destinations", async (req, res) => {
         const cursor = placeCollection.find({});
         const destinations = await cursor.toArray();
         res.send(destinations);
      });

      //GET api to get specific item
      app.get("/destination/:id", async (req, res) => {
         const id = req.params.id;
         const query = { _id: ObjectId(id) };
         const destination = await placeCollection.findOne(query);
         res.send(destination);
      });

      //delete a destination
      app.delete("/destination/:id", async (req, res) => {
         const id = req.params.id;
         const query = { _id: ObjectId(id) };
         const result = await placeCollection.deleteOne(query);
         res.json(result);
      });

      //GET api to see bookings
      app.get("/bookings", async (req, res) => {
         const cursor = bookingCollection.find({});
         const bookings = await cursor.toArray();
         res.send(bookings);
      });

      //GET api to see specific user booking
      app.get("/my-bookings", verifyJWToken, async (req, res) => {
         const email = req.query.email;
         const decodedEmail = req.decode.email;
         if (email === decodedEmail) {
            const query = { email: email };
            const myBookings = await bookingCollection.find(query).toArray();
            return res.send(myBookings);
         } else {
            return res.status(403).send({ message: "Forbidden access!!" });
         }
      });

      //POST api (booking)
      app.post("/bookings", async (req, res) => {
         const newBooking = req.body;
         const result = await bookingCollection.insertOne(newBooking);
         res.json(result);
      });

      //DELETE api
      app.delete("/bookings/:id", async (req, res) => {
         const id = req.params.id;
         const query = { _id: ObjectId(id) };
         const result = await bookingCollection.deleteOne(query);
         res.json(result);
      });

      //UPDATE api
      app.put("/bookings/:id", async (req, res) => {
         const id = req.params.id;
         const filter = { _id: ObjectId(id) };
         const options = { upsert: true };
         const updateDoc = {
            $set: {
               status: "Approved",
            },
         };
         const result = await bookingCollection.updateOne(
            filter,
            updateDoc,
            options
         );
         res.json(result);
      });

      // POST api for post a review
      app.post("/reviews", async (req, res) => {
         const newReviews = req.body;
         const result = await reviewsCollection.insertOne(newReviews);
         res.json(result);
      });

      //GET api for user reviews
      app.get("/user-reviews", async (req, res) => {
         const reviews = await reviewsCollection.find().toArray();
         res.send(reviews);
      });
   } finally {
      // await client.close();
   }
}
run().catch(console.dir);

app.get("/", (req, res) => {
   res.send("Crazy Traveler Server is running.");
});

app.listen(port, () => {
   console.log(`Server is now running on http://localhost:${port}`);
});
