import LikeCounter from "./LikeCounter.jsx";

export default function Headline(props) {
  return (
    <div className="Headline">
      <h2>{props.time}</h2>
      <h2>{props.text}</h2>
      <p>
        Temp: {props.temp} &deg;C, Wind: {props.wind} km/h
      </p>
      <LikeCounter />
    </div>
  );
}