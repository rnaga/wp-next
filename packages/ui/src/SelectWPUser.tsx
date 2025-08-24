import { useEffect, useState } from "react";

import { Autocomplete, AutocompleteValue } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";

import type * as wpTypes from "@rnaga/wp-node/types";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { Typography } from "./Typography";

import { SelectAutocomplete, type SlotSxProps } from "./SelectAutocomplete";

const sxSelectAutocomplete = SelectAutocomplete.sx;
const SelectAutocompleteTextField = SelectAutocomplete.TextField;
const RenderOption = SelectAutocomplete.RenderOption;

type FreeSolo = true | false;

type Value<T extends FreeSolo> = T extends true
  ? Pick<wpCoreTypes.actions.Users[number], "ID" | "user_nicename">
  : wpCoreTypes.actions.Users[number];

const getArgs = (
  args: wpCoreTypes.actions.SearchQuery<"user"> & Required<{ blog_id: number }>
) => {
  args = {
    ...args,
    exclude_anonymous: true,
    per_page: 20,
  };

  return [args, { context: "view" }] as const;
};

export const SelectWPUser = <T extends FreeSolo = false>(props: {
  onChange: (user: Value<T>) => any;
  defaultValue?: number;
  blogId: number;
  userArgs?: wpTypes.crud.CrudParameters<"user", "list">[0];
  userOptions?: wpTypes.crud.CrudParameters<"user", "list">[1];
  size?: "small" | "medium";
  slotSxProps?: SlotSxProps;
}) => {
  const {
    onChange,
    defaultValue,
    blogId,
    userOptions,
    userArgs,
    slotSxProps,
    size,
  } = props;
  const { actions, parse, safeParse } = useServerActions();

  const [users, setUsers] = useState<Value<T>[]>();
  const [currentUser, setCurrentUser] = useState<Value<T>>();

  useEffect(() => {
    (async () => {
      let currentUser: wpCoreTypes.actions.Users[number] | undefined;
      if (defaultValue) {
        [currentUser] = ((await actions.user
          .list(
            ...getArgs({
              blog_id: blogId,
              include: [defaultValue],
              per_page: 1,
            })
          )
          .then(parse)) ?? [])[0];

        setCurrentUser(currentUser);
      }

      const [users] = await actions.user
        .list(
          ...getArgs({
            blog_id: blogId,
            exclude: defaultValue ? [defaultValue] : undefined,
          })
        )
        .then(parse);

      setUsers(currentUser ? [...users, currentUser] : users);
    })();
  }, []);

  const handleSearch = async (value: string) => {
    const response = await actions.user
      .list(
        ...getArgs({
          blog_id: blogId,
          search: value,
        })
      )
      .then(safeParse);

    if (!response.success) {
      return;
    }
    setUsers(response.data);
  };

  const arePostsEqual = (a: Value<T>, b: Value<T>) => {
    return a.ID === b.ID;
  };

  const getUserKey = (user: Value<T>) => `${Math.random()}-${user.ID}`;

  if (!users || (defaultValue && !currentUser)) {
    return <Typography>Loading..</Typography>;
  }

  let value: Value<T> = currentUser;

  return (
    <SelectAutocomplete.Wrapper size={size} slotSxProps={slotSxProps}>
      <Autocomplete
        key={`user-${defaultValue ?? 0}`}
        size="small"
        //freeSolo={freeSolo}
        disableClearable
        value={value as AutocompleteValue<Value<T>, T, true, false | T>}
        onChange={(e, v) => {
          const user = v as Value<T>;
          console.log("onChange", v);
          setCurrentUser(user);
          onChange(user);
        }}
        onInputChange={(event, value, reason) => {
          if (typeof value === "string") {
            const newValue = {
              ID: 0,
              user_nicename: value,
            } as Value<T>;
            onChange(newValue);
            setCurrentUser(newValue);
          }
          if (reason === "input") {
            handleSearch(value);
          }
        }}
        getOptionKey={getUserKey}
        getOptionLabel={(option) => {
          if (typeof option === "string") {
            return option;
          }

          return typeof option !== "string" ? option.user_nicename : "";
        }}
        // getOptionLabel={(option) => option.post_title}
        isOptionEqualToValue={arePostsEqual}
        options={[...users]}
        renderInput={(params) => (
          <SelectAutocompleteTextField
            params={params}
            size={size}
            sx={slotSxProps?.textField}
          />
        )}
        sx={sxSelectAutocomplete({
          size: size ?? "small",
          sx: slotSxProps?.input,
        })}
        renderOption={(props, option, state) => {
          const postId = option.ID;
          return (
            <RenderOption
              key={postId}
              props={props}
              option={{
                label: option.user_nicename,
                id: `${postId}`,
              }}
              state={state}
            />
          );
        }}
      />
    </SelectAutocomplete.Wrapper>
  );
};
