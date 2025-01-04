  var express = require('express');
  const dbConnect = require("./db/dbConnect");
  const User = require("./db/userModel");
  const Trial = require("./db/trialModel");
  const Options = require("./db/optionsModel");
  const cron = require('node-cron');
  var router = express.Router();
  require('dotenv').config();
  var axios = require('axios')
  const bcrypt = require("bcrypt");
  const nodemailer = require('nodemailer');
  const mongoose = require("mongoose"); // Import mongoose
  let mega
  const { Storage } = require('megajs')
  const multer = require('multer');
  const fs = require('fs');
  const { PDFDocument } = require('pdf-lib');
  const pdf = require('pdf-parse');


  // DB connection
  dbConnect()
  // Setting up storage configuration

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory where files are stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Naming convention for uploaded files
    }
  });

  // Setting up multer with storage configuration
  const upload = multer({ storage: storage });


  // Setup Mega client
  ;(async function () {
    mega = new Storage({
      email: process.env.MEGA_USER,
      password: process.env.MEGA_PASS,
      userAgent: 'ExampleApplication/1.0'
    })
  
    // Will resolve once the user is logged in
    // or reject if some error happens
    await mega.ready
  }()).catch(error => {
    console.error(error)
  })


  // Change password button on login page, send code, when verified, choose new password

  // Mailer
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASS,
    },
  });


  // Daily Maitenance
  // * Send warning emails
  // * Delete inactive accounts (if they arent subscribed!)

  // Maitenance
  const job = cron.schedule('0 0 * * *', maintainUsers);
  //const job = cron.schedule('*/30 * * * * *', maintainUsers);
  job.start()
  
let latest;
const bypass_confirmations = false
  
const urlToPing = process.env.PING_URL;
 
const pingUrl = () => {
  axios.get(urlToPing)
    .then((res) => {
      latest = res.data
      
    })
    .catch((error) => {
      setTimeout(pingUrl, 2000); // Retry after 2 seconds
    });
};

cron.schedule('*/10 * * * *', pingUrl);
pingUrl();

  async function maintainUsers()
  {
    const currentDate = new Date();

    // Email me a confirmation that the server is running
    const mailOptions = {
      from: process.env.MAILER_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `Successful Template Maitenance`,
      text: `Hi Peter, just a confirmation that maitenance has ran for all Template users successfully.`,
    };
  
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending warning email:', error);
      } else {
      }
    });

    // Calculate the date 10 days from now
    const futureDate = new Date(currentDate);
    futureDate.setDate(currentDate.getDate() + 10);

    // Format the date as "Month Day, Year"
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = futureDate.toLocaleDateString('en-US', options);


    try {

      // SUBSCRIPTIONS

      // Find all users that renew today and check/update entitlements
      let users = await User.find({renewal_date: currentDate.getDate()})
        
      // Iterate through each user and update tokens if they have an active entitlement
      for (const user of users) {
        let subscribed = await isSubscribed(user._id)
        if (subscribed)
        {
          await User.updateOne({ _id: user._id }, { $set: { tokens: process.env.TOKEN_COUNT } });
        }
        else
        {
          // It looks like they expired today. Remove tokens.
          // Update: They did pay for month long access.. so dont remove the tokens. 
          await User.updateOne({ _id: user._id }, { $set: { renewal_date: 0 } });
          // Be sure to stop renewing them.
        }
        
      }


    
      // Increment 'dormant' field by 1 for all users
      await User.updateMany({}, { $inc: { dormant: 1 } });

      // Find and remove users with 'marked_for_deletion' and 'email_confirmed' both set to false
      await User.deleteMany({ marked_for_deletion: true });

      // Email a warning to all inactive users
      const dormantUsers = await User.find({
        $and: [
          { dormant: { $gte: 365 } }
        ]
      });

      // Send each email to dormant users who are not subscribed
      dormantUsers.forEach((user) => {
        
        // Dont delete paying users
        if (!isSubscribed(user._id))
        {
          const mailOptions = {
            from: process.env.MAILER_USER,
            to: user.email,
            subject: `${process.env.APP_NAME} account scheduled for deletion`,
            text: `Your ${process.env.APP_NAME} account hasn't been accessed in ${user.dormant} days, 
            and data is scheduled to be purged from our system on ${formattedDate}. 
            To keep your data, simply log in to your account. We hope to see you soon!`,
          };
        
          // Send the email
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('Error sending warning email:', error);
            } else {
            }
          });
  

        }
        
      });


      // MARK UNCONFIRMED USERS FOR DELETION
      try {
        // Find users where 'email_confirmed' is false
        const unconfirmedUsers = await User.find({ email_confirmed: false });
    
        // For all unconfirmed users prepare to mark for deletion
        // If they are not subscribed
        const updatePromises = unconfirmedUsers
        .filter(user => !isSubscribed(user._id))
        .map((user) => {
          user.marked_for_deletion = true;
          return user.save();
        });

    
        // Execute all the update operations
        await Promise.all(updatePromises);
    
      } catch (error) {
        console.error('Error marking users for deletion:', error);
      }


    } catch (error) {
      console.error('Error updating users:', error);
    }
  }





  // Endpoints


  router.get('/', (req,res) => {
      res.send(process.env.APP_NAME)
  })


  async function isSubscribed(user_id) {
    const maxRetries = 3; // Maximum number of retry attempts
    let retries = 0;
  
    while (retries < maxRetries) {
      try {
        const options = {
          method: 'GET',
          url: `https://api.revenuecat.com/v1/subscribers/${user_id}`,
          headers: { accept: 'application/json', Authorization: `Bearer ${REVENUECAT_API_KEY}` },
        };
  
        const response = await axios.request(options);
  
        // The user
        const subscriber = response.data.subscriber;
        const entitlements = subscriber.entitlements;
  
        // Look at the user's entitlements to check for cards
        for (const value of Object.values(entitlements)) {
          if (value['product_identifier'] === 'cards') {
            // Check if it is active
            const expirationTime = new Date(value.expires_date);
            const currentTime = new Date();
            return expirationTime > currentTime;
          }
        }
  
        // If no relevant entitlement was found, assume not subscribed
        return false;
      } catch (error) {
        if (error.response && error.response.status === 429) {
          const retryAfterHeader = error.response.headers['Retry-After'];
          if (retryAfterHeader) {
            const retryAfterMs = parseInt(retryAfterHeader)
            console.log(`Too Many Requests. Retrying after ${retryAfterMs} milliseconds...`);
            await wait(retryAfterMs);
          } else {
            console.log('Too Many Requests. No Retry-After header found.');
          }
          retries++;
        } else {
          // Handle other types of errors or non-retryable errors
          console.error('Error fetching isSubscribed: ', error.response.status);
          return false;
        }
      }
    }
  
    throw new Error(`Request to get isSubscribed failed after ${maxRetries} retries`);
  }
  
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }



  // Ensure alive
  router.get('/ping', async(req, res) => {
    res.json(Date.now())
  })

   // A user just subscribed
  // Verify their reciept => grant tokens
  router.post('/newSubscriber', async(req, res) => {
    let user_id = req.body.user_id
    // Anyone can call this endpoint
    // Implement security by checking subscription status
    const subscribed = await isSubscribed(user_id);

    if (subscribed)
    {
      let currentDate = new Date();
      let dayofmonth = currentDate.getDate()
      // User is verified! Grant the tokens
      User.findByIdAndUpdate(
        req.body.user_id,
        {
          // Sets the tokens to TOKEN_COUNT and stores the date on which to renew.
          $set: { tokens: process.env.TOKEN_COUNT, renewal_date: dayofmonth} // Set tokens
        }, {new: true}).then((user) => {
    
          if (user)
          {
            // Send me a notice email
            const mailOptions = {
              from: process.env.MAILER_USER,
              to: process.env.ADMIN_EMAIL,
              subject: `🎉 Template NEW SUBSCRIBER! `,
              text: `Woohoo! 🥳 ${user.email} just subscribed!`,
            };
          
            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('Error sending warning email:', error);
              } else {
              }
            });

            res.status(200).send({
              message: "Success!",
              tokens: user.tokens
            });
          }
          else
          {
            res.status(404).send({
              message: "User not found!",
            });
          }
        })
        .catch((e) => {
          res.status(500).send({
            message: e,
          });
        })


    }
    else
    {
      // User is not subscribed return 401 unauthorized.
      res.status(401).send({status: "Unauthorized"})
    }

  })
  
  // Mark user as active when app is opened
  router.post('/appOpened', (req, res) => {
    User.findByIdAndUpdate(
      
      req.body.user_id,
      {
        $set: { dormant: 0 }
      }, {new: true}).then((user) => {
        console.log(user.email, "opened the app")
      })
  })
  
  // Update special requests
  // Used to update the database value for a user given id
  router.post('/updateRequests', (req,res) => {
    User.findByIdAndUpdate(
      
      req.body.user_id,
      {
        $set: { requests: req.body.requests }
      }, {new: true}).then((user) => {
        console.log(user.email, "updated preferences")
        res.send('Success')
      })
      .catch((e) => {
        console.log(e)
        res.status(500).send(e)
      })
    
  })

  // Load the user when they log in
  // Can we move this to the return of /login? this is unclear!
  // the reason we don't, is because we only need to /login once which gets the id (and will also return the user object), 
  // and /user is used once we have the id to get the user object from id (where /login gets it from email / pass)

  router.post('/user', (req, response) => {
    // Define fields to exclude from the user object (for security)
    const excludedFields = ['password'];

    // Utility function to remove specified fields from user obj
    const excludeFields = (obj) => {
      const newObj = { ...obj };
      excludedFields.forEach(field => delete newObj[field]);
      return newObj;
    };

    // Get the user
    User.findByIdAndUpdate(
      req.body.user_id,
      {
        // Do we need this AND /appOpened?
        // added appOpened because ... we may store the user on the device, no need to retrieve from db (faster)
        // faster if we have cached data. But, we we only try to login if cached anyway.
        // because , we hit this endpoint when logging in, which will occur when the app mounts for the first time
        // so, ...
        $set: { dormant: 0 } // Set dormant days to 0: Handled now by /appOpened endpoint

      }, {new: true}).then(async (user) => {
        

        if (user)
        {

          response.status(200).send({
            
            user: excludeFields(user)._doc,
          });
        }
        else
        {
          response.status(404).send({
            message: "User not found!",
          });
        }
      })
      .catch((e) => {
        
        response.status(500).send({
          message: "Error finding user",
        });
      })
      
      
  })

  // Change the password
  router.post('/setNewPassword', async(req,res) => {
    let code = req.body.resetCode
    let pass = req.body.pass
    let email = req.body.email

    // Find the user 
    let user = await User.findOne({email: email})


        // Validate request
        if (user && user.code == code) {
          // user is authorized to change the password
          // hash the password
          bcrypt
          .hash(pass, 5)
          .then((hashedPassword) => {
            // create a new user instance and collect the data
            user.password = hashedPassword

            // save the user
            user.save()
              // return success if the new user is added to the database successfully
              .then((updatedUser) => {
                res.status(200).send({
                  message: "Password changed successfully",
                  token: user._id,
                });
              })
              // catch error if the new user wasn't added successfully to the database
              .catch((errorResponse) => {

                  res.status(500).send({
                    message: "Error changing password!",
                    errorResponse,
                  });
                
              });
          })
          // catch error if the password hash isn't successful
          .catch((e) => {
            res.status(500).send({
              message: "Password was not hashed successfully",
              e,
            });
          });

        }

        else{
          //unauthorized request
          res.status(401)
          res.json('Unauthorized')
        }


    
  })

  // Send reset code to email
  router.post('/resetPassword', (req, res) => {
    const randomDecimal = Math.random();
      const code = Math.floor(randomDecimal * 90000) + 10000;

      const updateOperation = {
          $set: {
            code: code
          },
        };
        
        // Use findOneAndUpdate to update the user's properties
        User.findOneAndUpdate(
          { email: req.body.email }, // Find the user by email
          updateOperation).then(() => {

            const mailOptions = {
              from: process.env.MAILER_USER,
              to: req.body.email,
              subject: `${code} is your ${process.env.APP_NAME} confirmaition code`,
              text: `A new password was requested for your account. If this was you, enter code ${code} in the app. If not, somebody tried to log in using your email.`,
            };
          
            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('Error sending email:', error);
                res.status(500)
                res.json({error: "error sending email"})
              } else {
                console.log('successfully sent code')
                res.status(200)
                res.json('successfully sent password reset email')
                
              }
            });
          }) 

  })

  // Function to send a verification code
  // New device is recognized during login. User account exists.
  // Must take user id and email, and device_id
  // store device_id in pending_device in user db
  // generate and store a device_code in user db
  // send email with the code and message
  async function sendCode(user, device) {

    return new Promise((resolve, reject) => {
      // Generate code
      const randomDecimal = Math.random();
      const code = Math.floor(randomDecimal * 90000) + 10000;

      const updateOperation = {
          $set: {
            code: code,
            pending_device: device,
            code_attempts: 0, // Reset failure count
          },
        };
        
        // Use findOneAndUpdate to update the user's properties
        User.findOneAndUpdate(
          { _id: user._id }, // Find the user by object ID
          updateOperation, // Apply the update operation
          { new: true }).then(() => {

            const mailOptions = {
              from: process.env.MAILER_USER,
              to: user.email,
              subject: `${code} is your ${process.env.APP_NAME} confirmaition code`,
              text: `Your ${process.env.APP_NAME} account was accessed from a new location. If this was you, enter code ${code} in the app. If not, you can change your password in the app. Feel free to reply to this email for any assistance!`,
            };
          
            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log('Error sending email:', error);
                reject('Could not send mail!')
              } else {
                console.log('successfully sent code')
                resolve('Sent code!')
                
              }
            });
          }) 
        
    }) // Promise end
    }

  // Check the code the user provided
  router.post("/confirmDevice", async (req, response) => {
    // fetch the pending code and device id 
    let user = await User.findOne({email: req.body.email})

    //let user = null
        if (user) {
            
            // Check if the codes match, if so add the device
            if (user.code == req.body.code)
            {
              // Before adding this device, check if we can activate trial tokens
              Trial.findOne({}).then((trial_doc) => {

                const emailExists = trial_doc.emails.includes(user.email);
                const deviceExists = trial_doc.devices.includes(user.pending_device);
                let new_user = true

                if (emailExists)
                {
                  new_user = false
                }
                else
                {
                  trial_doc.emails.push(user.email)
                }

                if (deviceExists)
                {
                  new_user = false
                }
                else
                {
                  trial_doc.devices.push(user.pending_device)
                }

                

                trial_doc.save()


                // Confirm email / grant trial if applicable
                User.findByIdAndUpdate(
                  user._id,
                  {
                    // Grant trial if applicable
                    // $inc: { tokens: new_user? process.env.TRIAL_TOKENS: 0 },
                    $set: { email_confirmed: true }, // Confirmed the email
                    $push: { devices: user.pending_device}
                  },
                  { new: true }).then((updatedUser) => {

                    if (updatedUser) {
                      response.status(200).send({
                        message: "Success!",
                        new_user: new_user,
                        new_account: !user.account_complete,
                        token: user._id
                      });


                    } else {
                      response.status(404).send({
                          message: "Could not locate user",
                      });
                    }

                  })
              })

                
                  

            }
            else{

              // If this is their third failed code
              if (user.code_attempts >= 2)
              {
                // Return exhausted status
                response.status(429).send({
                  message: "Too many requests!",
                  });

                return
              }

              // First or second failure: Increase count and send wrong code 401
              User.findByIdAndUpdate( user._id, { $inc: { code_attempts: 1 } },
                { new: true }).then((updatedUser) => {

                  if (updatedUser) {
                    


                  } else {
                    console.log('Failed updating user document api/confirmDevice')
                    response.status(404).send({
                        message: "Could not locate user",
        
                    });
                  }

                })

                // Moved to here instead of if statement so the UI response does not wait on a DB operation
                response.status(401).send({
                  message: "Wrong code!",
                  });
              
            }
    
        //console.log('Code:', user.code);
        //console.log('Pending Device:', user.pending_device);
        } else {
            response.status(404).send({
                message: "Could not find user",
              });
        }
})

// Delete a client
router.post("/delete-client", async (request, response) => {
  const userId = request.body.userId;
  const clientId = request.body.clientId;
  try {
    const result = await User.updateOne(
      { _id: userId },
      { $pull: { clients: { _id: new mongoose.Types.ObjectId(clientId) } } }
    );
    
    if (result.modifiedCount > 0) {
      response.status(200).send({ message: "Client deleted successfully." });
    }
    else {
      response.status(404).send({ message: "Client not found or no changes made." });
    }
  } catch (error) {
    console.error("Error deleting user client:", error);
    response.status(500).send({ message: "Internal server error." });
  }
});

// Add or edit client
router.post("/add-client", async (request, response) => {
  const userId = request.body.userId;
  const client = request.body.client;

  try {
    // Check if client._id exists
    if (client._id) {
      // Update the existing client
      const result = await User.updateOne(
        { _id: userId, "clients._id": client._id },
        {
          $set: {
            "clients.$.name": client.name,
            "clients.$.phone": client.phone || "",
            "clients.$.address": client.address || "",
            "clients.$.email": client.email || "",
            "clients.$.points": client.points || 0,
          },
        }
      );
      if (result.modifiedCount > 0) {
        response.status(200).send({ message: "Client updated successfully." });
      } else {
        response.status(201).send({ message: "No changes made" });
      }
    } else {
      // Add a new client
      const newClientId = new mongoose.Types.ObjectId().toString();
      const result = await User.updateOne(
        { _id: userId },
        {
          $push: {
            clients: {
              _id: newClientId,
              name: client.name,
              address: client.address || "",
              phone: client.phone || "",
              email: client.email || "",
              points: client.points || 0,
            },
          },
        }
      );
      if (result.modifiedCount > 0) {
        response.status(201).send({ message: "Client added successfully.", id: newClientId });
      } else {
        response.status(404).send({ message: "User not found or no changes made." });
      }
    }
  } catch (error) {
    console.error("Error updating user clients:", error);
    response.status(500).send({ message: "Internal server error." });
  }
});

// Delete a task
router.post("/delete-task", async (request, response) => {
  const userId = request.body.userId;
  const taskId = request.body.taskId;
  const taskClient = request.body.taskClient;


  try {
    const result = await User.updateOne(
      { _id: userId },
      { $pull: { [`tasks.${taskClient}`]: { _id: taskId } } }
    );
    
    if (result.modifiedCount > 0) {
      response.status(200).send({ message: "Task deleted successfully." });
    }
    else {
      response.status(404).send({ message: "Task not found or no changes made." });
    }
  } catch (error) {
    console.error("Error deleting user task:", error);
    response.status(500).send({ message: "Internal server error." });
  }
});

// Add or edit task
router.post("/add-task", async (request, response) => {
  const userId = request.body.userId;
  const task = request.body.task;
  const newClient = task.client ? task.client._id : "none";
  const curClient = request.body.curClient ? request.body.curClient._id : "none";

  try {
    // Check if the task has an _id (indicating an update)
    if (!(!task._id && task.doclink) && task._id) {
      // If the client association has changed, move the task
      if (newClient !== curClient) {
        // Remove the task from the current client's array
        await User.updateOne(
          { _id: userId },
          { $pull: { [`tasks.${curClient}`]: { _id: task._id } } }
        );

        // Add the task to the new client's array
        const result = await User.updateOne(
          { _id: userId },
          { $push: { [`tasks.${newClient}`]: task } }
        );

        if (result.modifiedCount > 0) {
          return response.status(200).send({ message: "Task updated successfully." });
        } else {
          return response.status(404).send({ message: "No changes made or task not found." });
        }

      } else {
        // If the client hasn't changed, just update the task
        const result = await User.updateOne(
          {
            _id: userId,
            [`tasks.${curClient}`]: { $elemMatch: { _id: task._id } },
          },
          {
            $set: { [`tasks.${curClient}.$`]: task },
          }
        );

        if (result.modifiedCount > 0) {
          return response.status(200).send({ message: "Task added successfully." });
        } else {
          return response.status(404).send({ message: "No changes made or task not found." });
        }
      }
    } else {
      // Add a new task
      const newId = new mongoose.Types.ObjectId().toString();

      // Add an `_id` field to the task object
      const enrichedTask = {
        ...task,
        _id: newId,
      };

      const result = await User.updateOne(
        { _id: userId },
        { $push: { [`tasks.${newClient}`]: enrichedTask } }
      );

      if (result.modifiedCount > 0) {
        return response.status(201).send({ message: "Task added successfully.", id: newId });
      } else {
        return response.status(404).send({ message: "User not found or no changes made." });
      }
    }
  } catch (error) {
    console.error("Error updating user tasks:", error);
    response.status(500).send({ message: "Internal server error." });
  }
});
// Delete a file
async function deleteFile(fullPath, fileId) {
  const folders = fullPath.split('/'); // Split the full path into folder names

  let megaFolder = mega.root; // The folder reference, starting at the root

  for (const folder of folders) {

    for (const dir of megaFolder.children) {
      if (dir.name === folder && dir.directory) {
        megaFolder = dir;
        break; // Break out of the loop once the folder is found
      }

    }

  }
  // megaFolder is the directory to delete the file from
  for (const file of megaFolder.children) {
    if (file.name.includes(fileId)) {
      await file.delete();
      break;
    }
  }

  

}

// Download a file
async function downloadFile(fullPath, fileId) {
  const folders = fullPath.split('/'); // Split the full path into folder names

  let megaFolder = mega.root; // The folder reference, starting at the root

  for (const folder of folders) {

    for (const dir of megaFolder.children) {
      if (dir.name === folder && dir.directory) {
        megaFolder = dir;
        break; // Break out of the loop once the folder is found
      }

    }

  }
  // megaFolder is the directory to download the file from
  for (const file of megaFolder.children) {
    if (file.name.includes(fileId)) {
      const data = await file.downloadBuffer()

      return data;
    }
  }

}

// Mega make folders
async function uploadFile(fullPath, file, fileName) {
  if (file?.path)
    buff = fs.readFileSync(file.path);
  else
    buff = file

  const folders = fullPath.split('/'); // Split the full path into folder names

  let megaFolder = mega.root; // The folder to insert the file to
  

  for (const folder of folders) {

    let exists = false;

    for (const dir of megaFolder.children) {
      if (dir.name === folder && dir.directory) {
        megaFolder = dir;
        exists = true;
        break; // Break out of the loop once the folder is found
      }

    }

    // If the folder doesn't exist, create it
    if (!exists) {
      megaFolder = await megaFolder.mkdir(folder);
    }

  }

  // megaFolder is the directory to add the file to
   // Upload compressed file to mega
   try {
    const result = await megaFolder.upload({ name: fileName }, buff).complete;
  }
  catch (e)
  {
    console.log(e)
  }
  
   //lean up local temp files
   if (file?.path)
   fs.unlinkSync(file.path);

}

// Download template file, when creating a new document
// Now it has been generalized to download any file
// need to remove the keys from the document, we already extracted them
router.get("/download-file", async (request, response) => {
  const path = request.query.path;
  const fileId = request.query.fileId;
  try {
        const file = await downloadFile(path, fileId);
        // const data = await pdf(buff);

        // // Regular expression to match $key$ patterns
        // const regex = /\$([a-zA-Z0-9_]+)\$/g;
    
        // // Replace all occurrences of $key$ with an empty string
        // const modifiedText = data.text.replace(regex, "");
    
        // // Load the original PDF
        // const pdfDoc = await PDFDocument.load(buff);
    
        // // Update each page of the PDF with modified content
        // const pages = pdfDoc.getPages();
        // for (let i = 0; i < pages.length; i++) {
        //     const page = pages[i];
        //     // Clear existing content and replace with the modified text
        //     page.drawText(modifiedText, {
        //         x: 50,
        //         y: page.getHeight() - 50,
        //         size: 12,

        //     });
        // }
    
        // // Save the modified PDF
        // const file = await pdfDoc.save();
        // fs.writeFileSync('temp.pdf', file);


        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('Content-Disposition', `attachment; filename=${fileId}.pdf`);
        response.send(file);
      
  } catch (error) {
    console.error("Error downloading file:", error);
    response.status(500).send({ message: "Internal server error." });
  }
});

// Delete a document
router.post("/delete-document", async (request, response) => {
  const userId = request.body.userId;
  const documentId = request.body.document._id;

  try {
    const result = await User.updateOne(
      { _id: userId },
      { $pull: { documents: { _id: documentId } } }
    );

    if (result.modifiedCount > 0) {
      await deleteFile(`${userId}/documents`, documentId);
      response.status(200).send({ message: "Document deleted successfully." });
    }
    else {
      response.status(404).send({ message: "Document not found or no changes made." });
    }
  } catch (error) {
    console.error("Error deleting user document:", error);
    response.status(500).send({ message: "Internal server error." });
  }
});


// Create (or save) a document from a template
router.post("/save-document", async (request, response) => {
  const userId = request.body.userId;
  let document = request.body.document;
  const pdfBuffer = Buffer.from(new Uint8Array(document.data));

  delete document.data; // Remove the data field from the document object


  
  try {
    // // Load template PDF, to replace the fields with the user's data
    // const template = await downloadFile(`${userId}/templates`, templateId);

    // const data = await pdf(template);

    // let modifiedText = data.text;
    // for (const [key, value] of Object.entries(fields)) {
    //     const regex = new RegExp(`\\$${key}\\$`, "g"); // Match $key$
    //     modifiedText = modifiedText.replace(regex, value);
    // }

    // // Load the original PDF
    // const pdfDoc = await PDFDocument.load(template);

    // // Update each page of the PDF with modified content
    // const pages = pdfDoc.getPages();
    // const pageHeight = pages[0].getHeight();

    // for (let i = 0; i < pages.length; i++) {
    //     const page = pages[i];
    //     page.drawText(modifiedText, {
    //         x: 50,
    //         y: pageHeight - 50,
    //         size: 12,
    //         font: await pdfDoc.embedFont(PDFDocument.PDFFont.Helvetica),
    //     });
    // }


    // Save the modified PDF
    //const pdfBuffer = await pdfDoc.save();
    

    // Add document to database user.documents if it doesn't exist (documentId is null) or update it if it does
    if (document._id) {
      const result = await User.updateOne(
        {
          _id: userId,
          documents: { $elemMatch: { _id:  document._id} },
        },
        {
          $set: { 'documents.$':  document  },
        }
      );

      if (result.matchedCount > 0) {
        await deleteFile(`${userId}/documents`, document._id)
        await uploadFile(`${userId}/documents`, pdfBuffer, `${document._id}.pdf`);

        return response.status(200).send({ message: "Document updated successfully.", doc: document });
      } else {
        return response.status(404).send({ message: "Doc not found." });
      }
    }

    // Add a new document
    const newDocumentId = new mongoose.Types.ObjectId().toString();

    // Add an `_id` field to the document object
    document._id = newDocumentId;

    await User.updateOne(
      { _id: userId },
      { $push: { 'documents': document } }
    );

    fs.writeFileSync('temp.pdf', pdfBuffer);


    await uploadFile(`${userId}/documents`, pdfBuffer, `${newDocumentId}.pdf`);


    response.status(201).send({ message: "Document added successfully.", doc: document });

  } catch (error) {
    console.error("Error creating document:", error);
    response.status(500).send({ message: "Internal server error." });
  }
});

router.post("/send-document", async (request, response) => {
  const { userId, document, message, allClients } = request.body;

  try {
    // Download the document
    const pdfBuffer = await downloadFile(`${userId}/documents`, document._id);

    // Make mail options, if message.client is falsey, send to each .email field in allClients array:
    const mailOptions = {
      from: process.env.MAILER_USER,
      to: message.client ? message.client.email : allClients.map(client => client.email).join(", "),
      subject: message.subject,
      text: message.body,
      attachments: [
        {
          filename: `${document.name}.pdf`,
          content: pdfBuffer,
        },
      ],
    };


    // Function to send the email
    const sendEmail = () => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Error sending email:", error);
          response.status(500).send({ message: "Error sending email." });
        } else {
          response.status(200).send({ message: "Email sent successfully." });
        }
      });
    };

    // If message.due is provided and valid, schedule the email
    if (message.method !== "Text") {
      if (message.due) {
        const dueTime = new Date(message.due).getTime();
        const now = Date.now();
        const delay = dueTime - now;

        if (delay > 0) {
          console.log(`Scheduling email to be sent in ${delay}ms`);
          setTimeout(sendEmail, delay);
          response.status(200).send({ message: "Email scheduled successfully." });
        } else {
          console.log("Due time is in the past. Sending immediately.");
          sendEmail();
        }
      } else {
        // Send immediately if no due time is provided
        sendEmail();
      }
    }
    else
    {
      // Texts handled on frontend for now
    }


  } catch (error) {
    console.error("Error sending document:", error);
    response.status(500).send({ message: "Internal server error." });
  }
});




// Add a new template (or edit)
router.post("/add-template", upload.single('file'), async (request, response) => {
  const userId = request.body.userId;
  const template = JSON.parse(request.body.template);
  const file = request.file

  // Update template fields
  // Extract fields from the PDF for rendering on frontend
  if (file)
  {
    const buff = fs.readFileSync(file.path);
    const data = await pdf(buff);

    const regex = /\$([a-zA-Z0-9_]+)\$([^\$]*)/g;
    let fields = {};
    let match;

    while ((match = regex.exec(data.text)) !== null) {
        const key = match[1];
        const value = match[2] ? match[2] : "";
        // Include the value if it is not a newline or whitespace
        fields[key] = value.charAt(0) === '\n' ? "" : value;
    }

    template.fields = fields

  }
  
  try {

    // Check if the task has an _id (indicating an update)
    if (template._id) {

      const result = await User.updateOne(
        {
          _id: userId,
          templates: { $elemMatch: { _id: template._id } },
        },
        {
          $set: { 'templates.$': template },
        }
      );
      
      

      if (result.matchedCount > 0) {
        if (file)
        {
          // Delete the old file from mega.nz, which is located at userId/templates/templateId.pdf
          deleteFile(`${userId}/templates`, template._id)
          uploadFile(`${userId}/templates`, file, `${template._id}.pdf`);

        }
        

        return response.status(200).send({ message: "Template added successfully." });
      } else {
        return response.status(404).send({ message: "Doc not found." });
      }
      
    } else {
      // Add a new template
      const newTemplateId = new mongoose.Types.ObjectId().toString();

      // Add an `_id` field to the task object
      const enrichedTemplate = {
        ...template,
        _id: newTemplateId,
      };

      const result = await User.updateOne(
        { _id: userId },
        { $push: { 'templates': enrichedTemplate } }
      );

      if (result.matchedCount > 0) {
        
        uploadFile(`${userId}/templates`, file, `${newTemplateId}.pdf`);


        return response.status(201).send({ message: "Template added successfully.", id: newTemplateId });
      } else {
        return response.status(404).send({ message: "Doc not found" });
      }
    }
  } catch (error) {
    console.error("Error updating user tasks:", error);
    response.status(500).send({ message: "Internal server error." });
  }
});

// Delete template (deletes the file from mega.nz)
// Delete a client
router.post("/delete-template", async (request, response) => {
  const userId = request.body.userId;
  const templateId = request.body.templateId;

  try {
    const result = await User.updateOne(
      { _id: userId },
      { $pull: { templates: { _id: new mongoose.Types.ObjectId(templateId) } } }
    );
    
    if (result.modifiedCount > 0) {

      // Delete the file from mega.nz, which is located at userId/templates/templateId.pdf
      deleteFile(`${userId}/templates`, templateId)
      response.status(200).send({ message: "Template deleted successfully." });
    }
    else {
      response.status(404).send({ message: "Template not found or no changes made." });
    }
  } catch (error) {
    console.error("Error deleting user template:", error);
    response.status(500).send({ message: "Internal server error." });
  }
});




  // Send help email
  router.post("/contact", (request, response) => {
    const mailOptions = {
      from: process.env.MAILER_USER,
      to: process.env.MAILER_USER,
      bcc: process.env.ADMIN_EMAIL,
      subject: `${process.env.APP_NAME} Support`,
      text: `${request.body.msg}\n\nfrom ${request.body.email} (${request.body.uid})`,
    };
  
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending support email from user:', error);
        response.status(500).send("Error")
      } else {
        response.status(200).send("Success")

      }
    });
  })


  // register endpoint
  // makes an account
  router.post("/register", (request, response) => {
    // hash the password
    bcrypt
      .hash(request.body.password, 5)
      .then((hashedPassword) => {
        // create a new user instance and collect the data

        const user = new User({
          email: request.body.email,
          password: hashedPassword,
          filters: {
            sports: userSports // Initialize filters.sports with sports data
          }
        });
  
        // save the new user
        user.save()
          // return success if the new user is added to the database successfully
          .then((result) => {
            // Email me of the new user, if option is enabled
            Options.findOne({}).then((option_doc) => {
              if (option_doc.registerAlerts)
              {
                // Send the email
                const mailOptions = {
                  from: process.env.MAILER_USER,
                  to: process.env.MAILER_USER,
                  bcc: process.env.ADMIN_EMAIL,
                  subject: `${process.env.APP_NAME} new user! 😁`,
                  text: `${request.body.email} has signed up!`,
                };
              
                // Send the email
                transporter.sendMail(mailOptions, (error, info) => {
                  if (error) {
                    console.log('Error sending new user email (to myself):', error);
                  } else {
                  }
                });
                
              }

            })

            response.status(201).send({
              message: "User Created Successfully",
              result,
            });
          })
          // catch error if the new user wasn't added successfully to the database
          .catch((errorResponse) => {
            let errorMessage = null;

            for (const key in errorResponse['errors']) {
              if (errorResponse['errors'][key].properties && errorResponse['errors'][key].properties.message) {
                errorMessage = errorResponse['errors'][key].properties.message;
                break; // Stop iterating once found
              }
            }

            if (errorMessage)
            {
              console.log(errorMessage)
              response.status(403).send({
                message: errorMessage,
                errorResponse,
              });
            }
            else{
              response.status(500).send({
                message: "User already exists!",
                errorResponse,
              });
            }
            
            
          });
      })
      // catch error if the password hash isn't successful
      .catch((e) => {
        response.status(500).send({
          message: "Password was not hashed successfully",
          e,
        });
      });
  });

/**
 * Verifies a user's identity by checking their password.
 * @param {string} uid - The user ID.
 * @param {string} password - The password to check.
 * @returns {Promise<Object>} - Resolves with the user object if successful, or rejects with an error message.
 */
function verifyUser(uid, password) {
  return User.findById(uid)
    .then((user) => {
      if (!user) {
        return Promise.reject({ status: 404, message: "User not found" });
      }

      return bcrypt.compare(password, user.password).then((passwordCheck) => {
        if (!passwordCheck) {
          return Promise.reject({ status: 401, message: "Wrong password" });
        }

        return user; // Return the user if password is correct
      });
    })
    .catch((error) => {
      // Handle unexpected errors
      if (!error.status) {
        console.error("Error during user verification:", error);
        error = { status: 500, message: "Internal server error" };
      }
      throw error;
    });
}

router.post('/update-account', (req, res) => {
  const { uid, password, newpass, newcompanyname } = req.body;

  verifyUser(uid, password)
    .then((user) => {

      // Cancel if nothing will change
      if (!newpass && newcompanyname === user.company) {
        return res.status(400).send({ message: "No changes provided" });
      }

      // Prepare the fields to update
      const updateFields = {};
      if (newcompanyname) updateFields.company = newcompanyname;

      // Hash the new password if provided
      if (newpass) {
        return bcrypt
          .hash(newpass, 10)
          .then((hashedPassword) => {
            updateFields.password = hashedPassword;
            return User.findOneAndUpdate({ _id: uid }, updateFields, { new: true });
          });
      }

      // If only company is updated
      return User.findOneAndUpdate({ _id: uid }, updateFields, { new: true });
    })
    .then((updatedUser) => {
      if (!updatedUser) {
        return res.status(400).send({ message: "Bad request" });
      }

      res.json({ id: updatedUser._id });
    })
    .catch((error) => {
      console.error(error); // Log the error for debugging
      const status = error.status || 500;
      const message = error.message || "Internal server error";
      res.status(status).send({ message });
    });
});

  

// login / register merged endpoint

router.post("/log-or-reg", (request, response) => {
    // check if email exists
    
    User.findOne({ email: request.body.email })
    
      // if email exists
      .then((user) => {
        
        // compare the password entered and the hashed password found
        bcrypt
          .compare(request.body.password, user.password)

          // if the passwords match
          .then(async (passwordCheck) => {

            
  
            // check if password matches
            if(!passwordCheck) {
                return response.status(400).send({
                message: "Passwords does not match",
              });
            }

            console.log('Logging in..')

            //Now check if device is permitted
            if (bypass_confirmations || user.devices.includes(request.body.device) || user.email == "demo@demo.demo")
            {

                response.status(200).send({
                    message: "Login Successful",
                    token: user._id,
                    new_account: !user.account_complete,
                    new_user: false
                });
            }
            else 
            {
                // Device not recognized. Send email code to recognize device!
                // When code is entered, allow the login and add the device to DB.

                sendCode(user, request.body.device).then((res) =>
                {
                  console.log("code sent!")
                    // Code was sent successfully 
                    response.status(422).send({
                        message: res
                    });

                })
                .catch((error) => {
                  console.log(error)
                  response.status(500).send({
                    message: error,
                });
                })
                
            }

            
  
            
          })
          // catch error if password does not match
          .catch((error) => {
            console.log(error)
            response.status(400).send({
              message: "Passwords do not match",
              error,
            });
          });
      })
      // catch error if email does not exist
      .catch((e) => {
        
        // @REGISTER : EMAIL NOT FOUND
        // hash the password
        bcrypt
        .hash(request.body.password, 5)
        .then((hashedPassword) => {
          // create a new user instance and collect the data
          const user = new User({
            email: request.body.email,
            password: hashedPassword,
            email_confirmed: bypass_confirmations
          });
    
          // save the new user
          user.save()
            // return success if the new user is added to the database successfully
            .then((result) => {
              // Email me of the new user, if option is enabled
              Options.findOne({}).then((option_doc) => {
                if (option_doc.registerAlerts)
                {
                  // Send the email
                  const mailOptions = {
                    from: process.env.MAILER_USER,
                    to: process.env.MAILER_USER,
                    bcc: process.env.ADMIN_EMAIL,
                    subject: `${process.env.APP_NAME} new user! 😁`,
                    text: `${request.body.email} has signed up!`,
                  };
                
                  // Send the email
                  transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                      console.log('Error sending new user email (to myself):', error);
                    } else {
                    }
                  });
                  
                }

              })

              if (bypass_confirmations)
              {
                response.status(200).send({
                  message: "Registration Successful",
                  token: user._id,
                  new_account: true,
                  new_user: false
                });
              }
              else
              {
                // Now, send the code to verify the email
                sendCode(user, request.body.device)
                .then((res) =>
                  {
                    console.log("code sent!")
                      // Code was sent successfully 
                      response.status(422).send({
                          message: res
                      });
    
                  })
                  .catch((error) => {
                    console.log(error)
                    response.status(500).send({
                      message: error,
                    });
                  })
              }

            })
            // catch error if the new user wasn't added successfully to the database
            .catch((errorResponse) => {
              
                response.status(500).send({
                  message: "Internal error!",
                  errorResponse,
                });
              
              
            });
        })
        // catch error if the password hash isn't successful
        .catch((e) => {
          response.status(500).send({
            message: "Password was not hashed successfully",
            e,
          });
        });

      });
  });

  //login
router.post("/login", (request, response) => {
// check if email exists

User.findOne({ email: request.body.email })

  // if email exists
  .then((user) => {
    
    
    // compare the password entered and the hashed password found
    bcrypt
      .compare(request.body.password, user.password)

      // if the passwords match
      .then(async (passwordCheck) => {

        

        // check if password matches
        if(!passwordCheck) {
            return response.status(400).send({
            message: "Passwords does not match",
          });
        }

        console.log('Logging in..')

        //Now check if device is permitted
        if (user.devices.includes(request.body.device) || user.email == "demo@demo.demo")
        {

            response.status(200).send({
                message: "Login Successful",
                token: user._id,
                new_account: !user.account_complete,
                new_user: false
            });
        }
        else 
        {
            // Device not recognized. Send email code to recognize device!
            // When code is entered, allow the login and add the device to DB.

            sendCode(user, request.body.device)
            .then((res) =>
            {
              console.log("code sent!")
                // Code was sent successfully 
                response.status(422).send({
                    message: res
                });

            })
            .catch((error) => {
              console.log(error)
              response.status(500).send({
                message: error,
            });
            })
            
        }

        

        
      })
      // catch error if password does not match
      .catch((error) => {
        console.log(error)
        response.status(400).send({
          message: "Passwords do not match",
          error,
        });
      });
  })
  // catch error if email does not exist
  .catch((e) => {
    
    response.status(404).send({
      message: "Email not found",
      e,
    });
  });
});

 

  // Delete account
  router.post('/deleteAccount', async(req, response) => {
    let pwd = req.body.password
    let id = req.body.id

    User.findById({_id: id })
      
        // if email exists
        .then((user) => {
          
          
          // compare the password entered and the hashed password found
          bcrypt
            .compare(pwd, user.password)

            // if the passwords match
            .then(async (passwordCheck) => {
    
              // check if password matches
              if(!passwordCheck) {
                  return response.status(400).send({
                  message: "Passwords does not match",
                });
              }

              User.findByIdAndDelete(id)
              .then((res)=> {
                response.status(200).send({
                  message: "Delete Successful"
              });

              })
              .catch((e) => {
                response.status(500).send({
                  message: e
              });

              })

                  
              
            })
            // catch error if password does not match
            .catch((error) => {
              console.log(error)
              response.status(400).send({
                message: "Passwords does not match",
                error,
              });
            });
        })
        // catch error if email does not exist
        .catch((e) => {
          
          response.status(404).send({
            message: "User not found",
            e,
          });
        });
  })


  module.exports = router;