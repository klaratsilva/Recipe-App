import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";
/**
 * - Search Object
 * - Current Recipe Object
 * - Shopping List Object
 * - Liked Recipes
 */

const state = {};

const controlSearch = async () => {
  // 1. Get query from the view
  const query = searchView.getInput(); //TODO
  if (query) {
    //2. New search object and add to state
    state.search = new Search(query);

    //3. Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    try {
      //4. Search for recipes
      await state.search.getResults();

      //5.Render results on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (err) {
      alert("sowmthing wrong with the search...");
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener("submit", e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener("click", e => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/**
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
  // Get ID from URL
  const id = window.location.hash.replace("#", "");
  if (id) {
    //prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    // Highlight Controller selected search item
    if (state.search) searchView.highlightSelected(id);

    // create new recipe
    state.recipe = new Recipe(id);

    // get recipe data and parse ingredients
    try {
      await state.recipe.getRecipe();
      console.log(state.recipe.ingredients);
      state.recipe.parseIngredients();

      // calculate servings
      state.recipe.calcTime();
      state.recipe.calcServings();

      // render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (err) {
      alert("error processing recipe");
    }
  }
};

["hashchange", "load"].forEach(event =>
  window.addEventListener(event, controlRecipe)
);

/**
 * LIST CONTROLLER
 */

const controlList = () => {
  //create new list if there is none yet
  if (!state.list) state.list = new List();

  //add each ingredient to the list and UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

//Handle delete and update list item events
elements.shopping.addEventListener("click", e => {
  const id = e.target.closest(".shopping__item").dataset.itemid;
  //Handle the delete button
  if (e.target.matches(".shopping__delete, .shopping__delete *")) {
    //delete from state
    state.list.deleteItem(id);

    //delete from UI
    listView.deleteItem(id);
  } else if (e.target.matches(".shopping__count-value")) {
    const val = parseFloat(e.target.value);
    state.list.updateCount(id, val);
  }
});

/**
 * LIKE CONTROLLER
 */

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();

  // A User has not yet liked the current recipe
  const currentID = state.recipe.id;
  if (!state.likes.isLiked(currentID)) {
    //Add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    //Toggle the like button
    likesView.toggleLikeBtn(true);

    //Add like to UI list
    likesView.renderLike(newLike);

    // B User has liked the current recipe
  } else {
    // Remove like from the state
    state.likes.deleteLike(currentID);

    // Toggle the like button
    likesView.toggleLikeBtn(false);

    // Remove like from UI list
    likesView.deleteLike(currentID);
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipes on pageLoad
window.addEventListener("load", () => {
  state.likes = new Likes();
  state.likes.readStorage();
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  //render recipes
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

// Handling recipe button clicks
elements.recipe.addEventListener("click", e => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    //decrease button is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    //increase button is clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
    // Add ingredients to shopping list
    controlList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    controlLike();
  }
});
