import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import VoiceCall from "../components/VoiceCall";
import { useCall } from "../context/CallContext";

function VoiceCallPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { resetCall } = useCall();

  const user = searchParams.get("user");
  const target = searchParams.get("target");
  const caller = searchParams.get("caller");

  const targetUser = location.state?.targetUser;

  const targetName = targetUser?.name || target;

  const targetPhoto = targetUser?.photo || null;

  console.log("📞 Voice Call User:", user);
  console.log("📞 Voice Call Target:", target);
  console.log("📞 Caller:", caller);
  console.log("📞 Target Name:", targetName);

  if (!user || !target) {
    return <div>Invalid call information</div>;
  }

  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  console.log("Target User:", targetUser);
  console.log("Initials:", getInitials(targetName));

  return (
    <VoiceCall
      user={user}
      receiver={target}
      receiverName={targetUser?.name}
      receiverPhoto={targetUser?.photo}
      receiverAvatarColor={targetUser?.avatarColor}
      receiverTextColor={targetUser?.textColor}
      receiverInitials={getInitials(targetName)}
      isCaller={true}
      onEnd={() => {
        resetCall();
        navigate("/messages", { replace: true });
      }}
    />
  );
}

export default VoiceCallPage;
