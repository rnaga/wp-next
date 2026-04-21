import { Typography } from "@rnaga/wp-next-ui/Typography";

export const RightPanelSectionTitle = (props: { title: string }) => {
  const { title } = props;
  return (
    <Typography fontSize={14} fontWeight={600} sx={{ mb: 1 }}>
      {title}
    </Typography>
  );
};
