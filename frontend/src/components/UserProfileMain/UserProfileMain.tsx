import { useEffect, useState } from "react";
import { getCurrentUser } from "../../services/User";
import type { UserResponseProfile } from "../../types/user";
import "./UserProfileMain.css";

const UserProfileMain = () => {
  const [data, setData] = useState<UserResponseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getCurrentUser();
        setData(response);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Erro ao buscar usuário");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!data) return <p>User not found.</p>;

  const favoriteHorse = data.horses[0];
  
  return (
    <div className="UserProfileMain">
      <div className="FavoriteHorse">
        <h3>Favorite Horse</h3>
        {favoriteHorse && (
          <img alt={favoriteHorse.name} src={`/horses/${favoriteHorse.name.replace(/\s+/g, "")}/${favoriteHorse.name.replace(/\s+/g, "")}1.png`}/>
        )}
      </div>
      <div className="UserInfos">
        <h1>{data.username}</h1>
        <h3>Monies: {data.monies}</h3>
      </div>
    </div>
  );
};

export default UserProfileMain;
