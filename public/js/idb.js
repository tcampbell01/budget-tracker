//create variable to hold db connection
const indexedDB = 
window.indexedDB || 
window.mozIndexedDB ||
window.webkitIndexedDB ||
window.msIndexedDB ||
window.shimIndexedDB;

let db;

//establish a connection to IndexedDB database called 'pizza_hunt' and set it to version 1
const request = indexedDB.open('budget-tracker', 1);

//this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)

request.onupgradeneeded = function(event) {
  let db = event.target.result;
  //create an object store (table) called 'new_pizza', set it to have an auto incrementing primary key of sorts 
  db.createObjectStore('pending', { autoIncrement: true });
};
//upon a successful
request.onsuccess = function(event) {
  // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run checkDatabase() function to send all local db data to api
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  // log error here
  console.log(event.target.errorCode);
};
//This function will be executed if we attempt to submit a new pizza and there's no internet connection
function saveRecord(record) {
    //open a new transaction with the database with read and write permissions
  const transaction = db.transaction(['pending'], 'readwrite');
//access the object store for 'new_pizza"
  const store = transaction.objectStore('pending');

  // add record to your store with add method.
  store.add(record);
}

function checkDatabase() {
  // open a transaction on your pending db
  const transaction = db.transaction(['pending'], 'readwrite');

  // access your pending object store
  const store = transaction.objectStore('pending');

  // get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          //open one more transaction
          const transaction = db.transaction(['pending'], 'readwrite');
          const store = transaction.objectStore('pending');
          // clear all items in your store
          store.clear();

         
        
     
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);
