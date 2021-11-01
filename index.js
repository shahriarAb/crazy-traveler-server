const { MongoClient } = require('mongodb');
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 5500;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8cjcg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db("travelInfo");
        const placeCollection = database.collection("destinations");
        const bookingCollection = database.collection("bookings");

        //POST api
        app.post('/destinations', async (req, res) => {
            const newDestination = req.body;
            const result = await placeCollection.insertOne(newDestination);
            res.json(result);
        })

        //GET api
        app.get('/destinations', async (req, res) => {
            const cursor = placeCollection.find({});
            const destinations = await cursor.toArray();
            res.send(destinations);
        })

        //GET api to get specific item
        app.get('/destination/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const destination = await placeCollection.findOne(query);
            res.send(destination);
        })

        //GET api to see bookings
        app.get('/bookings', async (req, res) => {
            const cursor = bookingCollection.find({});
            const bookings = await cursor.toArray();
            res.send(bookings);
        })

        //POST api (booking)
        app.post('/bookings', async (req, res) => {
            const newBooking = req.body;
            const result = await bookingCollection.insertOne(newBooking);
            res.json(result);
        })

        //DELETE api
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.json(result);
        })

        //UPDATE api
        app.put('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 'Approved'
                }
            };
            const result = await bookingCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Crazy Traveler Server is running.')
});

app.listen(port, () => {
    console.log(`Server is now running on http://localhost:${port}`);
});