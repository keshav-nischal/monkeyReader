import { Link } from "react-router-dom";

export const Logo = () => {
  return (
    <Link to="/" className="flex items-center group">
      <div>
        <span className="text-4xl">📚</span>
      </div>
      <span className="text-3xl font-boldtracking-wide">Monkey Read</span>
    </Link>
  );
};