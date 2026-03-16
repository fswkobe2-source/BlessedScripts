package net.runelite.blessedscripts.query.request;

import net.runelite.blessedscripts.query.result.QueryResult;
import net.runelite.blessedscripts.wrappers.RSWidgetItem;

import java.util.List;

import static net.runelite.blessedscripts.methods.MethodProvider.methods;

public class RSWidgetItemQueryRequest extends QueryRequest<RSWidgetItem> {
    public RSWidgetItemQueryRequest() {
        super();
    }
    public List<RSWidgetItem> request() {
        // TODO: add widgets to methods.
        return null;
    }
}
