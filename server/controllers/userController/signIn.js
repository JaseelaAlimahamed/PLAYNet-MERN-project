
const users = require('../../models/userModel')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')


const USER_REGEX = /^[a-zA-z][a-zA-Z0-9-_ ]{3,23}$/;
const MOBILE_REGEX = /^[0-9]{10}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%*]).{8,24}$/;

module.exports = {
    mobileExist: (req, res) => {
        if (!req.body.mobile) return res.status(400).json({ message: 'mobile - field required' })
        if (!MOBILE_REGEX.test(req.body.mobile)) return res.status(400).send({ message: 'Enter a valid number.' });
        users.findOne({ mobile: req.body.mobile }).then((response) => {
            if (response) {
                return res.status(409).json({ message: 'mobile number already exist' }) //user already exist
            } else {
                console.log("working");
                return res.status(200).json({ message: 'mobile number is not exist' });
            }
        }).catch(err => {
            console.log(err.message)
            res.status(400).json({ message: 'error occured', err: err.message })
        })
    },
    userSignup: (req, res) => {
        if (!req.body.mobile || !req.body.password || !req.body.name) return res.status(400).json({ message: 'name, mobile, password - fields required' })
        if (!USER_REGEX.test(req.body.name)) return res.status(400).json({ message: `name - "4 to 23 character", "required Must begin with a letter", "Letters, numbers, underscores, hyphens allowed."` });
        if (!PWD_REGEX.test(req.body.password)) return res.status(400).send({ message: 'password - "8 to 24 character", "Must include uppercase and lowercase letters, a number and a special character" , "Allowed special character: ! @ # * $ % "' });
        if (!MOBILE_REGEX.test(req.body.mobile)) return res.status(400).send({ message: 'Enter a valid number.' });
        users.findOne({ mobile: req.body.mobile }).then(async (response) => {
            if (response) {
                return res.status(409).json({ message: 'mobile - already exist' }); //user already exist
            } else {
                req.body.password = await bcrypt.hash(req.body.password, 10)
                await users.create(req.body).then((response) => {
                    const accessToken = jwt.sign({
                        id: response._id
                    }, 'jwt_9488',
                        { expiresIn: '7d' }
                    );
                    res.status(201).json(accessToken)
                }).catch(err => {
                    console.log(err.message)
                    res.status(400).json({ message: 'error occured', err: err.message })
                })
            }
        }).catch(err => {
            console.log(err.message)
            res.status(400).json({ message: 'error occured', err: err.message })
        })
    },
    googleSignin: async (req, res) => {
        if (!req.body.email || !req.body.fullName) return res.status(400).json({ message: 'email, fullName - fields is required' });
        const { email, fullName } = req.body
        users.findOne({ email }).then(async (response) => {
            if (response) {
                const accessToken = jwt.sign({ id: response._id, }, 'jwt_9488', { expiresIn: '7d' });
                res.status(200).json({ accessToken, name: response.name, mobile: response.email })
            } else {
                let data = await users.create({ email, name: fullName })
                const accessToken = jwt.sign({ id: data._id, }, 'jwt_9488', { expiresIn: '7d' });
                res.status(200).json({ accessToken, name: data.name, mobile: data.email })
            }
        })
    },
    userSignin: async (req, res) => {
        const { mobile, password } = req.body
        console.log(mobile);
        if (!mobile || !password) return res.status(400).json({ 'message': 'mobile number and password required.' });
        else {
            const foundUser = await users.findOne({ mobile })
            if (!foundUser) return res.status(401).json({ message: 'incorrect mobile number or password' }) //unauthorized
            else {
                console.log(password);
                bcrypt.compare(password,foundUser.password).then((response) => {
                    if (response) {
                        if (foundUser.blockStatus) {
                            return res.status(403).json({ message: 'user blocked by admin' }) //refuse to authorize it
                        } else {
                            const accessToken = jwt.sign({ id: foundUser._id, }, 'jwt_9488', { expiresIn: '7d' });
                            console.log(foundUser);
                            res.status(200).json({ accessToken, name: foundUser.name, mobile: foundUser.mobile, wallet: foundUser.wallet });
                        }
                    } else {
                        res.status(401).json({ message: 'incorrect mobile number or password' })
                    }
                }).catch(err => {
                    console.log(err.message)
                    res.status(400).json({ message: 'error occured', err: err.message })
                })
                
            }
        }
    },
   
}