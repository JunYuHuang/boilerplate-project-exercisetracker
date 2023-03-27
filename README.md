# Exercise Tracker

This is the boilerplate for the Exercise Tracker project. Instructions for building your project can be found at https://www.freecodecamp.org/learn/apis-and-microservices/apis-and-microservices-projects/exercise-tracker

## General Notes

- create API endpoints for 3 data structures:
    - Exercise
    - User
    - Log
- how these 3 are related:
    - a `User` can have many `Exercise`'s
    - an `Exercise` belongs to 1 `User`
    - a `Log` is a group of `Exercise`'s belonging to a `User` queried from some date range
- use MongoDB / Mongoose to save and retrieve documents
    - only need models / schemas for `User` and `Exercise`

## API Endpoints

- starts from root route `/api/users`

- `/?`
    - POST: creates user in DB, returns JSON obj
    - GET: returns JSON array
- `/:_id/exercises/?`
    - POST: creates exercise in DB, return JSON obj
- `/:_id/logs/?`
    - GET: 
        - if all query string parameters are empty,
            - return JSON array of all exercises of the user
        - else return filtered JSON array of exercises of user
            - filter based on optional params `from`, `to`, `limit`
        - check Mongoose docs for how to filter query results