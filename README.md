I want to build a swimming schedule app that let users to check which slots is available for swimming sessions.

The app should have the following features:

1. User can login using their Google account/ or just email and password. They can select the location/apartment they live in during sign up.
2. User can select the date they want to check the schedule for.
3. User can see the available slots for the selected date.
4. The Admin can add the booked slots for the selected date.
5. The availability of the slots is depedent on the booked slots + travel time between apartment/location. Example: if one slot is already booked at 3-4pm at tamarind(the apartmnet name), if another user wants to book the swimming session for quayside(another apartment name), the app needs to calculate the travel time from tamarind to quayside and add it to the total travel time. The travel time will be count as 30min.

Technical Stack:
- Frontend Only. Use React and React Router
- Use Firebase for authentication and database

