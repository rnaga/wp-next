import { Users } from "../../../components/contents/users";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";

export const Profile = () => {
  const { user } = useUser();

  return <Users.Edit userId={user?.ID} isProfile />;
};
