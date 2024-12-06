function deleteEmailById() {
  const userEmail = "finance@flavorgod.com"; // Replace with the email address of the user
  const messageId = "CAE4V3M5wCgVgpwWraNwTc4pfopBtBQpobJkL2hZ3hw@mail.gmail.com"; // Replace with the actual Message ID

  try {
    // Use GmailApp with user permissions
    Gmail.Users.Messages.remove(userEmail, messageId);
    Logger.log(`Successfully deleted email with ID: ${messageId}`);
  } catch (error) {
    Logger.log(`Error deleting email: ${error.message}`);
  }
}

// function deleteEmailById() {
//   const userEmail = "finance@flavorgod.com"; // Replace with the user's email
//   const messageId = "CAE4V3M5wCgVgpwWraNwTc4pfopBtBQpobJkL2hZ3hw@mail.gmail.com"; // Replace with the message ID

//   // Set up the service account
//   const serviceAccountEmail = "yp-macbook@exportscript.iam.gserviceaccount.com"; // Replace with your service account email
//   const privateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDicHGrLxdC2kxT\nRtHoCPgVXqmPp08a00DE1LK1Anp1taJylTBU1v/QVMvWwoJ/m4p/JHnBURuIrhTr\n+Cl7EsfZsUrbI+YIY9S8aTSKX06wbfZB/6csDE5u+AvOEY9ryIVSGyNWJ4aw9mN7\nVsXWt0KUiu1sej77o00wfVSILIF3zE1XFc4jMGARlfQlHUoFw5NcUUIDRdKC8gOR\n7LzN01JUh3zrt794XDzqyKoO/IhKTfr1NwS+5vP4PMHeIG7CwQJkHAKdM+c+APAa\nsOB+BWJzq+7jRAy0TudrpjAHOXY7oThBkWMTMHvf1whCF0ImCdEatvDM8gYWzyPd\n53Y3BznZAgMBAAECggEAB5l9fyDH95Lq/9p/Hfn7FYCFUVBsq7pOUKzQyJlqMbwk\nVRMjuZ0znbLS2oTRq2W1ernnKjFGKsqo4hiEj+Bb+7bjC8LDLCHpmF8xh7lWIz61\nhpaFbkmFclz5zHMzbIsgylYl0/TkpNjIEvIhFqk031ZgTIU3yus6ond6WE2iFLqi\n6pB3tDVCNgarTYtUfZjymLSKk5wXXdNhgML/JNNAK4CvVyKsyi1aRuzA8mxW79K9\ne20glNnd4TbK8JMRn/7u931yDZX7Rmon8dYBeSD1CoeMCnAgJelDTjW0ECnopzPq\ng3KxcKoouI6pb4KwFboZHnFvWjoACpqZCOUa+xacjwKBgQD7q5FOot8bryjmlq4w\ncykWZMHrbwjhAbv55naN/uDEonQSw3T/YOorKeiF4sTT1qAPc+KGqEppM7pynyf/\n02LL5Ur1OXrK7IY5wFPK64T60E7OfG0MidcgrloWVX9Q1ojlHHXkjdLkiYvTu0hL\n3bOwzHdI7tjE4WE2GjaMUSnQSwKBgQDmVcBoYJsCeXw0HWdbG9WmYlTvjmYl8riH\n77l3oZFPZb2nSHDZe1mTFrWsgMzCOaNox53vDCR1dXXHm9lGmSyiko4QliyV9T+L\nWQfosDBs0a1AwokvERruFRzQcTEtHzHY5JpuPi53a8gIzVOT05Nsa4O1pBhopyBW\nsOC0zS3v6wKBgAkBTZS7vTH3ZYZCs/7lz/2OI2YyNeYfMsOxXGKeURqYGYEmX0RY\nCmj6+ef4gkR2NIn5Ao0A7pCvGifJzBuaS7mx/amioeMq7W6ZlCX5oWt8EqXOy/Qb\n5oez1WNhMcoJsyJHj2xbKsWkqk0sMV0NlMVpu4bvjPAWhGz0KSmCKfXbAoGAX54d\nf7cK4l4YR3IlY9cMPEP5ynCsyvgVzqifr5/suK8dqgIShtYD+2GkDXZyifZvdaHY\nWFIMGI6oVDLIYdxYgSyhuRT+cUocFPbip5/sml/4sjePx3AsY8Vz7rvulDKs+ML9\nsOIzW/PsWGsUVPux6YJAbPkwANHQROyse6Hpff0CgYEAvg/dxtI2nuOw23ScRxIP\noiUCLvFmLk819ZWOD+o49VlbIKavvRUp7592BRnWX9z+SSPupxja5HRoLRD8FoHH\n1ubuVNokox3t7ZQDrO6RRrT3z/b3H7tEpb+arYBURGh4Mt5bIUeIdzine0rWV10g\nfAPvG7VORdXhqdJM2af/RrM=\n-----END PRIVATE KEY-----\n`;

//   const jwt = new google.auth.JWT(
//     serviceAccountEmail,
//     null,
//     privateKey,
//     ['https://www.googleapis.com/auth/gmail.modify'], // Scopes
//     userEmail
//   );

//   // Authenticate and delete the email
//   jwt.authorize((err, tokens) => {
//     if (err) {
//       Logger.log(`Error authorizing service account: ${err.message}`);
//       return;
//     }

//     const gmail = google.gmail({ version: 'v1', auth: jwt });

//     gmail.users.messages.delete(
//       {
//         userId: userEmail,
//         id: messageId,
//       },
//       (err, res) => {
//         if (err) {
//           Logger.log(`Error deleting email: ${err.message}`);
//         } else {
//           Logger.log(`Successfully deleted email with ID: ${messageId}`);
//         }
//       }
//     );
//   });
// }