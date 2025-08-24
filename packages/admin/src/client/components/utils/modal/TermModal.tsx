"use client";

import { useEffect, useState } from "react";

import { FormControl, FormLabel, Stack } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { SelectWPTerm } from "@rnaga/wp-next-ui/SelectWPTerm";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useAdminServerActions } from "../../../hooks/use-admin-server-actions";
import { useWPAdmin } from "../../../wp-admin";

import type * as types from "../../../../types";
import type * as wpTypes from "@rnaga/wp-node/types";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
export const TermModal = (props: {
  open: boolean;
  taxonomy?:
    | wpCoreTypes.actions.Taxonomies[number]["name"]
    | wpCoreTypes.actions.Taxonomies[number];
  selected?: wpCoreTypes.actions.Terms[number];
  onClose: () => void;
  onSave: (term: wpTypes.crud.CrudReturnType<"term", "create">["data"]) => void;
}) => {
  const { open, selected, onClose, onSave } = props;
  const { overlay } = useWPAdmin();
  const { actions, safeParse } = useAdminServerActions();

  const [taxonomy, setTaxonomy] =
    useState<wpCoreTypes.actions.Taxonomies[number]>();
  const { formData, setFormData, submit } =
    useFormData<types.client.formdata.TermUpsert>("term");

  useEffect(() => {
    if (!open) {
      return;
    }

    if (typeof props.taxonomy !== "string") {
      setTaxonomy(props.taxonomy);
      return;
    }

    overlay.circular
      .promise(actions.term.taxonomies().then(safeParse))
      .then((response) => {
        if (!response.success) {
          overlay.snackbar.open("error", response.error);
          onClose();
          return;
        }
        response.data.forEach((taxonomy) => {
          taxonomy.name == props.taxonomy && setTaxonomy(taxonomy);
        });
      });
  }, [open, props.taxonomy]);

  const handleSubmit = async (data: typeof formData) => {
    if (!taxonomy?.name) {
      return;
    }

    const termData = {
      name: data.name,
      parent: !taxonomy.hierarchical ? 0 : parseInt(`${data.parent ?? "0"}`),
      slug: data.slug,
      description: data.description,
    };

    const action = selected
      ? actions.term.update(selected.term_id, taxonomy.name, termData)
      : actions.term.create({
          taxonomyName: taxonomy.name,
          ...termData,
        });

    const result = await overlay.circular.promise(action.then(safeParse));

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      return;
    }

    onSave(result.data);
    onClose();
  };

  if (!open || !taxonomy) {
    return;
  }

  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: 2 }}>
      <ModalContent
        sx={{
          minWidth: 500,
        }}
      >
        <Typography bold fontSize={20}>
          {selected ? "Edit" : "New"} {taxonomy?.name}
        </Typography>
        <form onSubmit={submit(handleSubmit)}>
          <Stack spacing={2}>
            <FormControl>
              <FormLabel required>Name</FormLabel>
              <Input
                size="medium"
                name="name"
                value={selected?.name}
                required
              />
            </FormControl>
            <FormControl>
              <FormLabel>Slug</FormLabel>
              <Input size="medium" name="slug" value={selected?.slug} />
            </FormControl>
            {taxonomy?.hierarchical && (
              <FormControl>
                <FormLabel>Parent</FormLabel>

                <SelectWPTerm
                  size="medium"
                  taxonomy={taxonomy.name}
                  defaultValue={selected?.parent}
                  onChange={(term) => setFormData({ parent: term.term_id })}
                />
              </FormControl>
            )}
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Input
                size="medium"
                multiline
                name="description"
                value={selected?.description}
                minRows={3}
              />
            </FormControl>
            <Button size="medium" type="submit">
              Submit
            </Button>
          </Stack>
        </form>
      </ModalContent>
    </Modal>
  );
};
