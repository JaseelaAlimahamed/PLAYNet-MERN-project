const venues = require('../../models/venueModel')
const bookings = require('../../models/bookingModel')
const users = require('../../models/userModel')
const Razorpay = require('razorpay')
const crypto = require('crypto')
const { log } = require('console')
const jwt = require('jsonwebtoken');

const instance = new Razorpay({
    key_id: 'rzp_test_3qOFRfWWDf28ml',
    key_secret: 'sOAzU6SafVyzkTf4W7RO6IFh'
});

function isSlotTimePassed(bookedDate, bookedTime) {
    const bookingDate = new Date(`${bookedDate} ${bookedTime.substring(0, 5)}`);
    const now = new Date();
    const eightHoursAdd = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    // Check if the booking time is in the future and is less than 8 hours away
    if (bookingDate < eightHoursAdd) return true;
    return false;
}

module.exports = {
    bookTurf: async (req, res) => {
        try {
            const authHeader = req.header('Authorization');
            const verified = jwt.verify(authHeader, 'jwt_9488');
            console.log(verified.id);
            if (!req.body.turf || !req.body.method) return res.status(400).json({ message: "turf,method - id,( 'online' || 'wallet' ) field is required" })
            const { turf, slotTime, slotDate, sport, facility, method } = req.body
            const response = await venues.findOne({ _id: turf })
            let rs = response.actualPrice - (response.actualPrice * response.discountPercentage / 100)
            if (method === 'wallet') {
                if (!slotTime || !slotDate || !sport || !facility) return res.status(400).json({ message: 'slotTime, slotDate, sport, facility - datas needed to make a wallet include booking' })
                let user = await users.findOne({ _id: verified.id })
                if (user.wallet >= rs) {
                    await bookings.create({ userId: verified.id, turfId: turf, slotTime, slotDate, price: rs, sport, facility })
                    user.wallet = user.wallet - rs
                    let newData = await user.save()
                    return res.status(201).json({ message: 'booking successfully using fully wallet amount', wallet: newData.wallet })
                }
                rs = rs - user.wallet;
            }
            const options = {
                amount: rs * 100,
                currency: "INR",
                receipt: crypto.randomBytes(10).toString('hex')
            }
            instance.orders.create(options, (error, order) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ message: 'something went wrong', error: error.messaage });
                }
                console.log(order);
                res.status(200).json({order});
            })
        } catch (error) {
            console.log(error.message);
            res.status(400).json({ message: 'error occured', error: error.message });
        }
    },

    verifyPayment: async (req, res) => {
        try {
            const authHeader = req.header('Authorization');
            const verified = jwt.verify(authHeader, 'jwt_9488');
           
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, turfId, slotTime, slotDate, price, sport, facility } = req.body;
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !turfId || !slotTime || !slotDate || !price || !sport || !facility) return res.status(400).json({ messaage: 'razorpay_order_id, razorpay_payment_id, razorpay_signature, turfId, slotTime, slotDate, price, sport, facility - fields required' })
            
            const sign = razorpay_order_id + "|" + razorpay_payment_id

            const expectedSign = crypto.createHmac('sha256', 'sOAzU6SafVyzkTf4W7RO6IFh').update(sign.toString()).digest('hex')
            if (razorpay_signature === expectedSign) {
                const turf = await venues.findById(turfId)
                const setPrice = turf.actualPrice - (turf.actualPrice * turf.discountPercentage / 100);

                let user = await users.findOne({_id:verified.id})
                
                if(price/100 < setPrice){
                    const amountToBeReduce = setPrice - (price/100)
                    user = await users.findOneAndUpdate({ _id: verified.id }, { $inc: { wallet: -amountToBeReduce } }, { new: true })
                }
                await bookings.create({ orderId: razorpay_order_id, userId: verified.id, turfId, slotTime, slotDate, price: setPrice, sport, facility })
                return res.status(200).json({ message: 'payment verified succesfully', wallet:user.wallet })
            }
            return res.status(400).json({ message: 'Invalid signature sent!' })
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: 'internal server error',error:error.message })
        }
    },

    getBookings: async (req, res) => {
        try {
            bookings.find({ userId: req._id }).populate('turfId').then(response => {
                res.status(200).json(response)
            })
        } catch (error) {
            conosle.log(error)
            res.status(500).json({ message: 'internal server error' })
        }
    },

   
}