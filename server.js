// import express from 'express';
const express = require('express');
// import dotenv from 'dotenv';
const dotenv = require('dotenv');
// import cors from 'cors';
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const app = express();
const port = 3001;
const openai = new OpenAI({apiKey:process.env.OPENAI_API_KEY})
dotenv.config()
app.use(cors());
app.use(express.json());



const readJsonFile = (filePath) => {
    try {
      const rawData = fs.readFileSync(filePath);
      const parsedData = JSON.parse(rawData);
      return parsedData;
    } catch (error) {
      console.error(`An error occurred while reading ${filePath}:`, error);
      return null;
    }
  };
  
  const consolidatePlans = () => {
    try {
      const dirPath = './assets/';
      const allPlans = [];
  
      // Read all file names in the directory
      const files = fs.readdirSync(dirPath);
  
      // Loop through each file to read and consolidate plans
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileData = readJsonFile(filePath);
        
        if (fileData && fileData.plans && Array.isArray(fileData.plans)) {
          const serviceType = path.basename(file, path.extname(file));  // Use filename as serviceType
          
          // Map over each plan object to add the serviceType and make any other changes
          const plansWithType = fileData.plans.map(plan => {
            return {
              ...plan,
              serviceType,
              // Add any other transformations you want here. For example:
              // priceInCents: parseInt(plan.price.replace('$', '')) * 100
            };
          });
  
          allPlans.push(...plansWithType);
        }
      }
  
      return allPlans;
    } catch (error) {
      console.error(error);
      throw new Error('Something went wrong');
    }
  };
  // Route to get consolidated plans


  app.post('/completed-form', async (req, res) => {
    try {
      console.log(req)
      // Get the user's decisions from the request body
      const userDecisions = req.body.pref;
      console.log(`attempting to log ${userDecisions}`)
      // Get the consolidated plans
      const allPlans = consolidatePlans();
  
      // Create the message for OpenAI API
      const systemMessage = "Based on the users' decisions, make the executive decision of which marketing plan fits their needs best.";
      const userMessage = `The users' decisions concluded to the following: ${JSON.stringify(userDecisions)}`;
      const plansMessage = `Here are the available plans: ${JSON.stringify(allPlans)}`;
      console.log(userMessage)
      // Generate the response from OpenAI
      const completion = await openai.chat.completions.create({
        messages: [
          { "role": "system", "content": systemMessage },
          { "role": "user", "content": userMessage },
          { "role": "assistant", "content": plansMessage }
        ],
        model: "gpt-3.5-turbo"
      });
  
      // Extract the response
      const response = completion.choices[0].message.content;
  
      // Send the response back to the client
      res.json({ message: response });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong' });
    }
  });



app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });