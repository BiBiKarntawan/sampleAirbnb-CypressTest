const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();
const PORT = 3000;

// MongoDB connection
const client = new MongoClient(MONGODB_URI);
let listingsCollection;
let bookingsCollection;


// Set up view engine and static folder
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
client.connect()
  .then(() => {
    const db = client.db('sample_airbnb');
    listingsCollection = db.collection('listingsAndReviews');
    bookingsCollection = db.collection('bookings');
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });


  app.get('/', async (req, res) => {
    const { location, propertyType, bedrooms } = req.query;
    const query = {};
  
    if (location) {
      query['address.market'] = { $regex: new RegExp(location, 'i') };
    }
  
    if (propertyType) {
      query.property_type = propertyType;
    }
  
    if (bedrooms) {
      query.bedrooms = parseInt(bedrooms);
    }
  
    try {
      let listings;
  
      if (!location) {
        listings = await listingsCollection.aggregate([{ $sample: { size: 30 } }]).toArray();
      } else {
        listings = await listingsCollection.find(query).toArray();
      }
  
      res.render('index', { listings, filters: req.query });
    } catch (err) {
      console.error('Search Error:', err);
      res.status(500).send('Server error');
    }
  });
  

//Booking Page
app.get('/booking', async (req, res) => {
  const id = req.query.listing_id;

  try {
    const listing = await listingsCollection.findOne({ _id: id });

    if (!listing) {
      return res.status(404).send('Listing not found');
    }

    res.render('booking', { listing });

  } catch (err) {
    console.error('Booking Error:', err.message);
    res.status(500).send('Server error');
  }
});


//confirm page
app.post('/confirm', async (req, res) => {
  try {
    const {
      listing_id,
      start_date,
      end_date,
      client_name,
      client_email,
      client_phone,
      address,
      resident_address
    } = req.body;

    const booking = {
      bookingID: 'B' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
      listingID: listing_id,
      clientName: client_name,
      clientEmail: client_email,
      clientPhone: client_phone,
      postalAddress: address,
      residentialAddress: resident_address,
      startDate: new Date(start_date),
      endDate: new Date(end_date),
      createdAt: new Date()
    };

    await bookingsCollection.insertOne(booking);
    console.log(' Booking saved:', booking);

    res.render('confirmation', { booking });

  } catch (err) {
    console.error(' Booking error:', err.message);
    res.status(500).send('Server error');
  }
});


// Start server
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
