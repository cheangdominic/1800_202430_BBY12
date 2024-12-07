# Project Title
UpDog

## 1. Project Description
UpDog is a web-based mobile app designed to create meaningful connections between humans and dogs. We want to enable our users to synchronise their schedules with each other and build a community with an emphasis on the dog’s well being. The project's key features include profile management, playdate scheduling, friends system, and a community chat.

## 2. Names of Contributors
List team members and/or short bio's here... 
* Hi! My name is Aaron! I am a former consultant, former chef, current CST student. 
* Hi, my name is Dominic Cheang! I am a current CST student and am coming straight out of highschool.
* Hi, my name is Jun Morimoto! I would love to explore our journy building codes as a team. 
* Hi, my name is Trung!
	
## 3. Technologies and Resources Used
List technologies (with version numbers), API's, icons, fonts, images, media or data sources, and other resources that were used.
* HTML, CSS, JavaScript
* Bootstrap 5.0 (Frontend library)
* Firebase 8.0 (BAAS - Backend as a Service)
* MapBox v3.7.0 (API)
* Javascript API for filereader; image conversion to base64 strings

## 4. Complete setup/installion/usage
State what a user needs to do when they come to your project.  How do others start using your code or application?
Here are the steps ...
* The app can be accessed at updog-d7aa0.web.app or through live serve

## 5. Known Bugs and Limitations
Here are some known bugs:
* Playdate covers may be innaccurate to location due to longitude and latitude address searching inaccuracies

## 6. Features for Future
What we'd like to build in the future:
* Public profiles to view when clicking participants that joined playdates. 
* Filters for playdates: Locations, dog sizes, ages, etc. 
* Private chat with friends
* MapBox sourced locations for scheduling playdates with friends
	
## 7. Contents of Folder
Content of the project folder:

```
 Top level of project folder: 
├── .gitignore               # Git ignore file
├── 404.html                 # 404 error HTML file, shown when file is not able to be shown
├── chat.html		     # chat HTML file, page where users chat to eachother
├── create_doggo.html        # add dog HTML file, page where users can add their own dog
├── dog_profile.html         # dog profile HTML file, the base page for a user's dog's profile
├── edit_profile.html        # edit dog profile HTML file, the base page for when a user edits their profile
├── FAQ.html                 
├── firebase.json            # 
├── firebase.indexes.json
├── firestore.rules
├── friends.html             # friends HTML file, the page to show a user's added friends and friend requests
├── inbox.html               # joined playdates HTML file, displays the playdates a user has joined
├── index.html               # landing HTML file, this is what users see when you come to url
├── login.html               # login HTML file, this is what users see when they want to login
├── main.html          	     # main page HTML file, what users see when they login
├── maps.html                # map page HTML file, displays the map UI
├── navigation_info.html     # article page HTML file, information about our apps ability to make park navigation easier
├── playdates_info.html      # article page HTML file, information about our playdate feature
├── profile.html             # profile HTML file, base page for a user's profile
├── public_profile.html      # public profile HTML file, base page for a user's public profile
├── README.md
└── socializing_info.html    # article page HTML file, information about socializing on our app

It has the following subfolders and files:
├── .git                     # Folder for git repo
├── images                   # Folder for images
    /blah.jpg                # Acknowledge source
├── scripts                  # Folder for scripts
    /authentication.js       # Firebae authentication
    /autoaddress.js          # Geocoder auto address selection
    /chat.js                 # Chat feature
    /create_doggo.js         # Creating a dog
    /dateofplaydate.js       # The min and max of selected date for playdate creation 
├── styles                   # Folder for styles
    /blah.css                # 



```


