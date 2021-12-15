"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

// storyList.stories = array of stories (BJS note)

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
        <span class="transparent">★</span>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        <button class= removeStory hidden Btn>RemoveStory</button>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}


async function putNewStoryOnPage(evt) {
  console.debug("Add Story", evt);
  evt.preventDefault();

  // grab story data
  const title = $('#story-title').val();
  const author = $('#story-author').val();
  const url = $('#story-url').val();
  const username = currentUser.username
  const storyData = { title, url, author, username }

  const story = await storyList.addStory(currentUser, storyData);

  const storyId = story.storyId;
  
  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  // li.removeAttribute('hidden');

  // console.log(span);

  $newStoryForm.slideUp('slow');
  $newStoryForm.trigger("reset");
  setTimeout(putStoriesOnPage, 1000)

  setTimeout(function() {
  let li = $('#' + storyId)
  let button = $(li).find('button')
  console.log(button)
  button.removeAttr('hidden')
  }, 1000)
}

$newStoryForm.on("submit", putNewStoryOnPage);


async function removeStoryFromPage(evt) {
  console.debug("remove Story", evt);
  evt.preventDefault();

  const liId = $(this).parent().attr('id')
  const storiesArray = storyList.stories
  const ownStories = currentUser.ownStories
  const favorites = currentUser.favorites

  removeStoryFromArray(storiesArray, liId);
  removeStoryFromArray(favorites, liId);
  removeStoryFromArray(ownStories, liId);

  let targetStory = getStory(liId);
  targetStory = targetStory[0]

  const story = await storyList.removeStory(currentUser, liId);

  $(this).parent().fadeOut('slow');
  setTimeout(putStoriesOnPage, 2000)

  // putStoriesOnPage()
  // console.log('it is finished')
  return story
}
$allStoriesList.on('click', 'button', removeStoryFromPage);

// accepts a storyId and returns an array with the story object
function getStory(storyId){
let storyInstance = storyList.stories.filter(function(story) {
  if(storyId === story.storyId) {
    return story
  }
})
return storyInstance;
}

function removeStoryFromArray(array,storyId) {
  const results = array.findIndex(x => x.storyId === storyId);
  console.log(results);
  array.splice(results, 1);
}

async function toggleFavorites(evt) {
  //  retrieve the story id
    let liId = $(this).parent().attr('id')
    let eventTarget = evt.target

    // call function to find and return the story associated with click
    const storyInstance = getStory(liId);

    // check if storyid is in favorites. return 'false' if not in favorites and 'true' if in favorites
    let favorites = currentUser.favorites.some(function(story) {
      return liId === story.storyId
    })

    // if NOT currently a favorite, call addFavorite instance method to add as a favorite
    if (favorites === false) {
      if(evt.target.className === 'transparent') {
        evt.target.className = 'highlight'
      }
      saveUserFavoritesInLocalStorage(eventTarget)
      const response = await currentUser.addFavorite(storyInstance)
      return response
    }

    // if currently a favorite, call removeFavorite instance method to remove as a favorite
    if (favorites === true) {
      if(evt.target.className === 'highlight') {
        evt.target.className = 'transparent'
      }
      saveUserFavoritesInLocalStorage(eventTarget)
      const response = await currentUser.removeFavorite(storyInstance)
      return response
    }
}

$allStoriesList.on('click','span', toggleFavorites)



async function checkForFavorites() {
  console.debug("checkForFavorites");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token || !username) return false;

  // try to log in with these credentials (will be null if login failed)
  currentUser = await User.loginViaStoredCredentials(token, username);
}

function saveUserFavoritesInLocalStorage(evt) {
  if($(evt).hasClass('highlight')){
    localStorage.setItem(evt, 'highlight');
}
else{
    localStorage.setItem(evt, 'transparent');
}
  // console.debug("saveUserFavoritesInLocalStorage");
  // if (currentUser) {
  //   localStorage.setItem("favorites", currentUser.favorites);
  // }
}


