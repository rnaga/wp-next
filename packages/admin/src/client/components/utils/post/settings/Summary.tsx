"use client";

import { useEffect } from "react";

import { Box, FormControl } from "@mui/material";
import { DateTimePicker } from "@rnaga/wp-next-ui/DateTimePicker";
import { useFormDataContext } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Select } from "@rnaga/wp-next-ui/Select";
import { SelectWPUser } from "@rnaga/wp-next-ui/SelectWPUser";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { formatting } from "@rnaga/wp-node/common/formatting";

import * as types from "../../../../../types";
import { useWPAdmin } from "../../../../wp-admin";

const FormContent = (props: { children: React.ReactNode; label: string }) => {
  const { children, label } = props;

  return (
    <FormControl
      sx={{
        gap: 2,
        py: 0.5,
        display: "grid",
        gridTemplateColumns: "20% 1fr",
        alignItems: "center",
        "& .MuiFormControl-root": {
          width: "100%",
        },
      }}
    >
      <Typography>{label}</Typography>
      {children}
    </FormControl>
  );
};

export const Summary = () => {
  const { site } = useWPAdmin();
  const { formData, setFormData } =
    useFormDataContext<types.client.formdata.PostUpsert>("post");

  useEffect(() => {
    if (!formData?.ID) {
      setFormData({
        post_date: formatting.dateMySQL({
          offsetMinutes: site.settings.time_offset_minutes,
        }),
      });
    }
  }, []);

  return (
    <Box sx={{ mt: 2 }}>
      <FormContent label="Status">
        <Select
          size="medium"
          enum={[
            { label: "Publish", value: "publish" },
            { label: "Private", value: "private" },
            { label: "Draft", value: "draft" },
            { label: "Pending", value: "pending" },
            { label: "Future", value: "future" },
          ]}
          value={formData?.post_status ?? "publish"}
          onChange={(value) => {
            console.log("Selected weight:", value);
            setFormData({ post_status: value });
          }}
        />
      </FormContent>

      <FormContent label="Publish Date">
        <Box>
          <DateTimePicker
            size="medium"
            value={formData.post_date}
            onChange={(newValue) => {
              setFormData({
                post_date: formatting.dateMySQL(newValue, {
                  withGMTOffset: true,
                }),
              });
            }}
          />
          <Typography>{site.settings.timezone}</Typography>
        </Box>
      </FormContent>

      {formData?.post_status === "publish" && (
        <FormContent label="Password">
          <Input
            size="medium"
            key="password"
            value={formData.post_password ?? ""}
            onChange={(value) => {
              setFormData({ post_password: value });
            }}
          />
        </FormContent>
      )}

      <FormContent label="Slug">
        <Input
          size="medium"
          value={formData?.post_name ?? ""}
          onChange={(value) => {
            formData && setFormData({ post_name: value });
          }}
        />
      </FormContent>

      <FormContent label="Author">
        <SelectWPUser
          size="medium"
          blogId={site.blogId}
          defaultValue={formData?.post_author}
          onChange={(user) => setFormData({ post_author: user.ID })}
        />
      </FormContent>
    </Box>
  );
};
