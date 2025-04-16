import { useActionData } from "react-router-dom";
import SearchBar from "../../components/searchBar/SearchBar";
import "./homePage.scss";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

function HomePage() {

  const {currentUser} = useContext(AuthContext);

  console.log(currentUser);
  return (
    <div className="homePage">
      <div className="textContainer">
        <div className="wrapper">
          <h1 className="title">Find Real Estate & Get Your Dream Place</h1>
          <p>
          Welcome to EliteEstates, where your dream
          home awaits! Explore our vast collection of real estate listings and uncover the perfect place to call home. Whether you're searching for a cozy apartment, a spacious family house, or a luxurious estate, we have something for every lifestyle and 
          budget. Start your journey towards finding your dream property today!
          </p>
          <SearchBar />
          <div className="boxes">
            <div className="box">
              <h1>16+</h1>
              <h2>Years of Experience</h2>
            </div>
            <div className="box">
              <h1>200</h1>
              <h2>Award Gained</h2>
            </div>
            <div className="box">
              <h1>2000+</h1>
              <h2>Property Ready</h2>
            </div>
          </div>
        </div>
      </div>
      <div className="imgContainer">
        <img src="/bg.png" alt="" />
      </div>
    </div>
  );
}

export default HomePage;
