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
  ? Pick<wpCoreTypes.actions.Posts[number], "ID" | "post_title">
  : wpCoreTypes.actions.Posts[number];

export const SelectWPPost = <T extends FreeSolo = false>(props: {
  onChange: (post: Value<T>) => any;
  defaultValue?: number;
  postArgs?: wpTypes.crud.CrudParameters<"post", "list">[0];
  postOptions?: wpTypes.crud.CrudParameters<"post", "list">[1];
  size?: "small" | "medium";
  slotSxProps?: SlotSxProps;
  freeSolo?: T;
}) => {
  const {
    onChange,
    defaultValue,
    postOptions,
    postArgs,
    slotSxProps,
    size,
    freeSolo = false,
  } = props;
  const { actions, parse, safeParse } = useServerActions();

  const [posts, setPosts] = useState<Value<T>[]>();
  const [currentPost, setCurrentPost] = useState<Value<T>>();

  const postTypes = postOptions?.postTypes ?? ["post"];

  useEffect(() => {
    (async () => {
      let currentPost: wpCoreTypes.actions.Posts[number] | undefined;
      if (defaultValue) {
        [currentPost] = ((await actions.post
          .list(
            { include: [defaultValue], per_page: 1, ...postArgs },
            { postTypes, ...postOptions }
          )
          .then(parse)) ?? [])[0];

        setCurrentPost(currentPost);
      }

      const [posts] = await actions.post
        .list(
          {
            exclude: defaultValue ? [defaultValue] : undefined,
            ...postArgs,
          },
          { postTypes, ...postOptions }
        )
        .then(parse);

      setPosts(currentPost ? [...posts, currentPost] : posts);
    })();
  }, []);

  const handleSearch = async (value: string) => {
    const response = await actions.post
      .list(
        {
          search: value,
          ...postArgs,
        },
        { postTypes, ...postOptions }
      )
      .then(safeParse);

    if (!response.success) {
      return;
    }
    setPosts(currentPost ? [...response.data, currentPost] : response.data);
  };

  const arePostsEqual = (a: Value<T>, b: Value<T>) => {
    return a.ID === b.ID;
  };

  const getPostKey = (post: Value<T>) => `${Math.random()}-${post.ID}`;

  if (!posts || (defaultValue && !currentPost)) {
    return <Typography>Loading..</Typography>;
  }

  let value: Value<T> = currentPost;
  if (freeSolo && !currentPost) {
    value = {
      ID: 0,
      post_title: "",
    } as Value<T>;
  }

  return (
    <SelectAutocomplete.Wrapper size={size} slotSxProps={slotSxProps}>
      <Autocomplete
        key={`post-${defaultValue ?? 0}`}
        size="small"
        freeSolo={freeSolo}
        disableClearable
        value={value as AutocompleteValue<Value<T>, T, true, false | T>}
        onChange={(e, v) => {
          const post = v as Value<T>;
          console.log("onChange", v);
          setCurrentPost(post);
          onChange(post);
        }}
        onInputChange={(event, value, reason) => {
          if (freeSolo && typeof value === "string") {
            const newValue = {
              ID: 0,
              post_title: value,
            } as Value<T>;
            onChange(newValue);
            setCurrentPost(newValue);
          }
          if (reason === "input") {
            handleSearch(value);
          }
        }}
        getOptionKey={getPostKey}
        getOptionLabel={(option) => {
          if (freeSolo && typeof option === "string") {
            return option;
          }

          return typeof option !== "string" ? option.post_title : "";
        }}
        // getOptionLabel={(option) => option.post_title}
        isOptionEqualToValue={arePostsEqual}
        options={[...posts]}
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
                label: option.post_title,
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

export const SelectFreeSoloWPPost = (
  props: Parameters<typeof SelectWPPost<true>>[0]
) => {
  const { freeSolo, ...rest } = props;
  return <SelectWPPost {...rest} freeSolo={true} />;
};
