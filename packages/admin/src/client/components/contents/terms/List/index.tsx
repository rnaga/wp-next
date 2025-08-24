import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

import { AccordionDetails, Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Accordion } from "@rnaga/wp-next-ui/Accordion";
import {
  ActionTd,
  ListGrid,
  ListGridItem,
  ListGridTitle,
  SortableTh,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@rnaga/wp-next-ui/list";
import { Loading } from "@rnaga/wp-next-ui/Loading";
import { SelectWPTaxonomy } from "@rnaga/wp-next-ui/SelectWPTaxonomy";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { TermModal } from "../../../../components/utils/modal";
import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../../wp-admin";
import { ActionLink } from "./ActionLink";
import { Toolbar } from "./Toolbar";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import type * as wpTypes from "@rnaga/wp-node/types";

type Permissions = Record<wpTypes.TaxonomyCapability, boolean>;

type EditState = {
  open: boolean;
  addNew: () => void;
  selectedTerm?: wpCoreTypes.actions.Terms[number];
};

export const TermsContext = createContext<{
  edit: EditState;
  setEdit: Dispatch<SetStateAction<EditState>>;
  taxonomy?: wpCoreTypes.actions.Taxonomies[number];
  permissions?: Permissions;
}>({} as any);

export const List = () => {
  const { overlay } = useWPAdmin();
  const { refresh, pushRouter } = useAdminNavigation();
  const { actions, parse, safeParse } = useServerActions();
  const { queryObject, navigationStatus, refreshValue } = useAdminNavigation<
    wpCoreTypes.actions.SearchQuery<"term"> & {
      taxonomy: wpTypes.TaxonomyName;
    }
  >();

  const { taxonomy: taxonomyName = "category", ...listQueryObject } =
    queryObject;

  const [{ terms, info }, setTerms] = useState<{
    terms: wpCoreTypes.actions.Terms | undefined;
    info: wpCoreTypes.actions.TermsInfo | undefined;
  }>({
    terms: undefined,
    info: undefined,
  });

  const [taxonomy, setTaxonomy] =
    useState<wpCoreTypes.actions.Taxonomies[number]>();
  const [permissions, setPermissions] = useState<Permissions>();

  const [edit, setEdit] = useState<EditState>({
    open: false,
    addNew: () => {
      setEdit({ ...edit, open: true, selectedTerm: undefined });
    },
    selectedTerm: undefined,
  });

  const [loading, startTransition] = useTransition();

  const fetchTerms = useCallback(async () => {
    if (!taxonomy) {
      return;
    }

    const [terms, info] = await actions.term
      .list(taxonomyName, {
        orderby: "term_id",
        order: "desc",
        ...listQueryObject,
      })
      .then(parse);

    setTerms({ terms, info });
  }, [taxonomy, navigationStatus, refreshValue().content]);

  useEffect(() => {
    startTransition(fetchTerms);
  }, [taxonomy, navigationStatus]);

  useEffect(() => {
    fetchTerms();
  }, [refreshValue().content]);

  useEffect(() => {
    if (!taxonomy) {
      return;
    }

    const fetchPermissions = async () => {
      let permissions: Permissions = {
        manage_terms: false,
        assign_terms: false,
        edit_terms: false,
        delete_terms: false,
      };

      if (!taxonomy.capabilities) {
        return permissions;
      }

      for (const key of Object.keys(
        permissions
      ) as wpTypes.TaxonomyCapability[]) {
        permissions[key] = (
          await actions.user.can(taxonomy.capabilities[key]).then(safeParse)
        ).data;
      }

      return permissions;
    };

    fetchPermissions().then(setPermissions);
  }, [taxonomy]);

  const handleEditClose = () => {
    setEdit({ ...edit, open: false, selectedTerm: undefined });
  };

  const handleOnSave = () => {
    overlay.snackbar.open("success", "Term has been saved");
    refresh(["content"]);
  };

  const handleClickTaxonomy = (
    taxonomy: wpCoreTypes.actions.Taxonomies[number]
  ) => {
    setTaxonomy(taxonomy);
    pushRouter({ taxonomy: taxonomy.name });
  };

  const handleInitTaxonomy = (
    taxonomy: wpCoreTypes.actions.Taxonomies[number]
  ) => {
    setTaxonomy(taxonomy);
  };

  return (
    <TermsContext.Provider value={{ edit, setEdit, taxonomy, permissions }}>
      <TermModal
        open={edit.open}
        onClose={handleEditClose}
        onSave={handleOnSave}
        taxonomy={taxonomy}
        selected={edit.selectedTerm}
      />
      <Stack spacing={1}>
        <Toolbar terms={terms} info={info}>
          <SelectWPTaxonomy
            size="medium"
            onClick={handleClickTaxonomy}
            onInit={handleInitTaxonomy}
            defaultValue={taxonomyName}
          />
        </Toolbar>

        <Loading loading={loading || !taxonomy}>
          <Table>
            <THead>
              <SortableTh name="Name" orderby="name" />
              <SortableTh
                viewport="desktop"
                name="Description"
                orderby="description"
              />
              <SortableTh viewport="desktop" name="Slug" orderby="slug" />
              <Th viewport="desktop" style={{ width: "80px" }}>
                Count
              </Th>
            </THead>
            <tbody>
              {terms &&
                terms.map((term) => {
                  return (
                    <Tr style={{ paddingTop: "1em" }} key={`${term.term_id}`}>
                      <ActionTd viewport="desktop">
                        <Typography size="medium" bold>
                          {term.name}
                        </Typography>
                        <ActionLink term={term} />
                      </ActionTd>
                      <Td viewport="mobile">
                        <Accordion>
                          <ListGridTitle title={term.name} />
                          <AccordionDetails>
                            <ActionLink term={term} />
                            <ListGrid>
                              <ListGridItem title="Slug">
                                {term.slug}
                              </ListGridItem>
                              <ListGridItem title="Description">
                                {term.description}
                              </ListGridItem>
                            </ListGrid>
                          </AccordionDetails>
                        </Accordion>
                      </Td>
                      <Td viewport="desktop">{term.description}</Td>
                      <Td viewport="desktop">{term.slug}</Td>
                      <Td viewport="desktop">{term.count}</Td>
                    </Tr>
                  );
                })}
            </tbody>
          </Table>
        </Loading>
      </Stack>
    </TermsContext.Provider>
  );
};
