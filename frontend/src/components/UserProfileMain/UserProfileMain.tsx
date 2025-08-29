import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUser } from "../../services/User";
import "./UserProfileMain.css";

const UserProfileMain = () => {
  const { userId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUser(userId!);
        setData(response);
        console.log(response);
        
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (loading) return <p>Loading...</p>;

  console.log(data.horses[0].name);
  
  return (
    <div className="UserProfileMain">
      <div className="FavoriteHorse">
        <h3>Favorite Horse</h3>
        <img src={`/horses/${data.horses[0].name.replace(/\s+/g, "")}/${data.horses[0].name.replace(/\s+/g, "")}1.png`}/>
      </div>
      <div className="UserInfos">
        <h1>{data.username}</h1>
        <h3>Monies: {data.monies}</h3>
      </div>
    </div>
  );
};

export default UserProfileMain;
