import { useEffect, useState } from "react";
import { getCurrentUser, getToken } from "../../services/User";
import type { UserResponseProfile } from "../../types/user";
import CustomLink from "../../utils/CustomLink";
import RaceHistory from "../RaceHistory/RaceHistory";
import RetiredHorses from "../RetiredHorses/RetiredHorses";
import "./UserProfileMain.css";

const UserProfileMain = () => {
  const [data, setData] = useState<UserResponseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Without a token this page is not an error, it just needs a login.
  const [signedOut, setSignedOut] = useState(!getToken());

  useEffect(() => {
    if (signedOut) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await getCurrentUser();
        setData(response);
      } catch (error) {
        if (!getToken()) {
          setSignedOut(true);
          return;
        }
        setError(error instanceof Error ? error.message : "Erro ao buscar usuário");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [signedOut]);

  if (loading) return <p className="UserProfileMain__state">Loading...</p>;

  if (signedOut || (error && !data)) {
    return (
      <div className="UserProfileMain__state">
        <h2>{signedOut ? "Você não está logado" : "Não foi possível carregar o perfil"}</h2>
        <p>{signedOut ? "Entre para ver seu perfil e o histórico de corridas." : error}</p>
        <CustomLink to="/Login" title="Ir para o login" className="UserProfileMain__cta" />
      </div>
    );
  }

  if (!data) return <p className="UserProfileMain__state">User not found.</p>;

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
      <RaceHistory />
      <RetiredHorses horses={data.horses} />
    </div>
  );
};

export default UserProfileMain;
