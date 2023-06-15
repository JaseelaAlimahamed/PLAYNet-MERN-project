const vendor = require('../../models/vendorModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


module.exports = {
    mobileExist:(req,res) => {
        if(!req.body.mobile) return res.status(400).json({message:'mobile - field is required'})
        vendor.findOne({ mobile: req.body.mobile }).then(async (response) => {
            if (response) {
                return res.status(400).json({message:'mobile number already exist'}); //user already exist
            } else {
                return res.sendStatus(200);
            }
        }).catch(err=>{
            console.log(err.message)
            res.status(400).json({ message: 'error occured', err: err.message })
        })
    },
    vendorSignup: async (req,res) => {
        if( !req.body.name || !req.body.mobile || !req.body.password || !req.body.image ) return res.status(400).json({message:'name, mobile, password, image - fields is required'})
        vendor.findOne({ mobile: req.body.mobile }).then(async (response) => {
            if (response) {
                return res.status(409).json({message:'mobile number already exist'}); //user already exist
            } else {
                req.body.password = await bcrypt.hash(req.body.password, 10)
                await vendor.create(req.body).then((response) => {
                    const accessToken = jwt.sign({
                        id: response._id
                    },'jwt_9488',
                        { expiresIn: '7d' }
                    )
                    res.status(201).json({ accessToken,name:response.name,mobile:response.mobile,image:response.image,status:response.status,reason:response.reason })
                }).catch(err=>{
                    console.log(err.message)
                    res.status(400).json({ message: 'error occured', err: err.message })
                })
            }
        }).catch(err=>{
            console.log(err.message)
            res.status(400).json({ message: 'error occured', err: err.message })
        })
    },  
    signin: async (req, res) => {
        const { mobile, password } = req.body
        if (!mobile || !password) return res.status(400).json({ 'message': 'mobile number and password required.' });
        else {
            //checking user exist with his mobile
            try {
                const foundUser = await vendor.findOne({ mobile })

                if (foundUser && (await bcrypt.compare(password, foundUser.password))) {

                    //checking user blocked
                    if (foundUser.blockStatus) {
                        res.status(403).json({ message: 'blocked' }) //refuse to authorize it
                    } else {
                        const accessToken = jwt.sign({ id: foundUser._id, }, 'jwt_9488', { expiresIn: '7d' });
                        res.status(200).json({ accessToken, name: foundUser.name, mobile: foundUser.mobile, document: foundUser.image, status: foundUser.status, reason: foundUser.reason });
                    }

                } else {
                    res.status(401).json({ message: 'invalid mobile or password' }) // unauthorized
                }
            } catch (error) {
                console.log(error.message)
                res.status(400).json({ message: 'error occured', err: error.message })
            }
        }
    },
   
}