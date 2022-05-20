const express = require ('express');
const router = express.Router();
const gravatar =require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check,validationResult}=require ('express-validator');
const User = require('../../models/User');


// @route POST api/users
// @desc test route
// @access Public
router.post(
    '/',
    [
    check('name','Name is required')
      .not().isEmpty(),
    check('email','Please include a valid email')
      .isEmail(),
    check('password','Please enter password with 6 or more characters')
      .isLength({min:6})
    ],
async(req,res) =>{ 
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    const { name, email, password } = req.body;

    try {
        // see if user exist
        let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

    //generate avatar
    const avatar = gravatar.url(email, {
      d: 'mm',
      r: 'pg',
      s: '200'
    });

     // New User instante
     user = new User({
      name,
      email,
      avatar,
      password
    });

    // Hash PW with bcrypt
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);


    // save user to db
    await user.save();
    // Return json webtoken
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      config.get('jwtSecret'),
      { expiresIn:3600000000000000 },
      (err, token) => {
        if (err) {
          throw err;
        }
        res.json({ token });
      }
    );    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');

      
    }
});
module.exports = router;
