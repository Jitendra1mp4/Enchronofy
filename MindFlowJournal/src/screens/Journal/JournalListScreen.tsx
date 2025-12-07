import { ExportModal } from "@/src/components/common/ExportModal";
import {
  exportAsJSON,
  exportAsMarkdown,
  exportAsPDF,
} from "@/src/services/exportService";
import { Journal } from "@/src/types";
import { Alert } from "@/src/utils/alert";
import { getMarkdownStyles } from "@/src/utils/markdownStyles";
import { format, parseISO } from "date-fns";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { Card, Chip, FAB, Searchbar, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  deleteJournal,
  listJournals,
} from "../../services/unifiedStorageService";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import {
  deleteJournal as deleteJournalAction,
  setLoading,
} from "../../stores/slices/journalsSlice";
import { getJournalCardStyle } from "../../utils/theme";

const JournalListScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  // const { encryptionKey } = useAuth();
  const encryptionKey = useAppSelector((state) => state.auth.encryptionKey);

  const { selectedDate } = route.params || "";

  const journals = useAppSelector((state) => state.journals.journals);

  const [journalsToList, setJournalsToList] = useState(journals);

  const isLoading = useAppSelector((state) => state.journals.isLoading);

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const JournalList = ({ item, index }: { item: Journal; index: number }) => {
    const dateObj = new Date(item.date);
    const formattedDate = format(dateObj, "MMM dd, yyyy");
    const formattedTime = format(dateObj, "hh:mm a");
    const hasImages = item.images && item.images.length > 0;

    const cardStyle = getJournalCardStyle(theme, index);
    const previewText =
      item.text.length > 50 ? item.text.substring(0, 50) + "..." : item.text;

    const markdownStyles = getMarkdownStyles(theme);

    const handleDelete = () => {
      Alert.alert(
        "Delete Journal Entry",
        "Are you sure you want to delete this entry? This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: confirmDelete,
          },
        ],
      );
    };
    const confirmDelete = async () => {
      if (!encryptionKey) return;

      setIsDeleting(true);
      try {
        await deleteJournal(item.id);
        dispatch(deleteJournalAction(item.id));
        navigation.goBack();
      } catch (error) {
        console.error("Error deleting journal:", error);
        Alert.alert("Error", "Failed to delete journal entry");
      } finally {
        setIsDeleting(false);
      }
    };

    return (
      <Card
        style={[styles.journalCard, cardStyle]}
        onPress={() =>
          navigation.navigate("JournalDetail", {
            journalId: item.id,
            backColor: cardStyle.backgroundColor,
          })
        }
      >
        <ExportModal
          visible={showExportModal}
          journalsList={filteredJournals}
          selectedDate={selectedDate}
          onExport={handleExport}
          onClose={() => setShowExportModal(false)}
        />

        <Card.Content>
          {item.title && (
            <Text variant="titleMedium" style={styles.title}>
              {item.title}
            </Text>
          )}
          <View style={styles.dateContainer}>
          </View>
          <View style={styles.preview}>
            <Markdown style={{ ...markdownStyles }}>{previewText}</Markdown>
          </View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <Chip
              icon="calendar"
              style={{ ...styles.chip }}
              textStyle={{fontSize:11, color: "#6b6b6bff" }}
              compact
            >
              {formattedDate}
            </Chip>
            {formattedTime && (
              <Chip
                icon="clock-outline"
                compact
                style={{ ...styles.chip }}
                textStyle={{ fontSize:11, color: "#5c5c5cff" }}
              >
                {formattedTime}
              </Chip>
            )}
            {hasImages && (
              <Chip icon="image" compact style={{ ...styles.chip }}>
                {item.images!.length}
              </Chip>
            )}
            <Chip
              mode="outlined"
              onPress={handleDelete}
              style={{
                ...styles.chip,
                borderColor: "#e44",
              }}
              icon="delete"
              disabled={isDeleting}
            >{""}</Chip>
            <Chip
              mode="flat"
              onPress={() =>
                navigation.navigate("JournalEditor", { journalId: item.id })
              }
              style={{ ...styles.chip, borderColor: "green" }}
              icon="pencil"
            >{""}</Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  useEffect(() => {
    const load = async () => {
      if (selectedDate) loadJournalsForDate(selectedDate);
      else await loadJournals();
    };

    load();
  }, [encryptionKey]);

  const loadJournals = async () => {
    if (!encryptionKey) return;

    dispatch(setLoading(true));
    try {
      const loadedJournals = await listJournals(encryptionKey);
      // Sort by date (newest first)
      const sorted = loadedJournals.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      setJournalsToList(sorted);
      // dispatch(setJournals(sorted));
    } catch (error) {
      console.error("Error loading journals:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const loadJournalsForDate = (dateKey: string) => {
    const journalsForDate = journalsToList.filter((j) => {
      const date = new Date(j.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const journalDateKey = `${year}-${month}-${day}`;
      return journalDateKey === dateKey;
    });

    const sorted = journalsForDate.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    setJournalsToList(sorted);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedDate) loadJournalsForDate(selectedDate);
    else await loadJournals();
    setRefreshing(false);
  };

  const filteredJournals = journalsToList.filter((journal) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      journal.title?.toLowerCase().includes(query) ||
      journal.text.toLowerCase().includes(query)
    );
  });

  const selectedDateFormatted = selectedDate
    ? format(parseISO(selectedDate), "EEEE, MMMM dd, yyyy")
    : "";

  const handleExport = async (exportFormat: "json" | "text" | "pdf") => {
    if (journalsToList.length === 0) {
      Alert.alert("No Journals", "There are no journals to export.");
      return;
    }

    setIsExporting(true);
    try {
      let fileUri: string;
      let fileName: string;
      let mimeType: string;

      const dateFormatted = format(parseISO(selectedDate), "yyyy-MM-dd");

      if (exportFormat === "json") {
        const content = await exportAsJSON(journalsToList);
        fileName = `journals-${dateFormatted}.json`;
        mimeType = "application/json";
        fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } else if (exportFormat === "text") {
        const content = await exportAsMarkdown(journalsToList);
        fileName = `journals-${dateFormatted}.md`;
        mimeType = "text/plain";
        fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } else {
        // PDF returns a URI directly
        fileUri = await exportAsPDF(journalsToList);
        mimeType = "application/pdf";
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: `Export Journals - ${format(parseISO(selectedDate), "MMMM dd, yyyy")}`,
        });
      } else {
        Alert.alert("Export Complete", `File saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(
        "Export Failed",
        "Failed to export journals. Please try again.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const showExportOptions = () => {
    setShowExportModal(true);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
       (
        <Card
          style={{
            ...styles.headerCard,
            borderColor: theme.colors.secondary,
            borderWidth: 2,
          }}
        >
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.headerTextContainer}>
                <Text variant="titleLarge" style={styles.headerTitle}>
                  {selectedDateFormatted??"All Journals"}
                </Text>
                <Text variant="bodySmall" style={styles.entryCount}>
                  {journalsToList.length}{" "}
                  {journalsToList.length === 1 ? "entry" : "entries"}
                </Text>
              </View>
              <Chip
                mode="flat"
                icon="export"
                onPress={showExportOptions}
                disabled={isExporting || journalsToList.length === 0}
              >
                Export
              </Chip>
            </View>
          </Card.Content>
        </Card>
      )

      {journalsToList.length > 0 && (
        <Searchbar
          placeholder="Search journals..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      )}

      {filteredJournals.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            {searchQuery ? "No results found" : "No journals yet"}
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            {searchQuery
              ? "Try a different search term"
              : "Tap the + button to create your first entry"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredJournals}
          renderItem={JournalList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 80 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* TODO: link to create journal for selectedDate  */}
      <FAB
        icon="pencil"
        style={styles.fab}
        label="New"

        onPress={() =>{
          if (selectedDate !== null && selectedDate !== "" )
           navigation.navigate("JournalEditor", { selectedDate })
          else  navigation.navigate("JournalEditor")
          }}
      />

      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  headerTitle: {
    fontWeight: "bold",
  },
  entryCount: {
    opacity: 0.7,
    marginTop: 4,
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  list: {
    padding: 16,
  },
  journalCard: {
    marginBottom: 12,
    elevation: 2,
  },
  title: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  dateContainer: {
    flexDirection: "row",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  preview: {
    opacity: 0.8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  chip: {
    marginBottom: 8,
    backgroundColor: "#ffffff93",
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    opacity: 0.7,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 20,
    bottom: 50,
  },
  imageChip: {
    marginLeft: 8,
  },
});

export default JournalListScreen;
