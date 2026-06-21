import { NextResponse } from "next/server";
import { requireBackendSession } from "@/lib/auth-session";
import { BackendApiError, fetchEventGuestList, uploadEventGuestList } from "@/lib/idnight-backend";

function routeErrorResponse(error: unknown, fallbackMessage: string) {
  const status = error instanceof BackendApiError ? error.status : 500;
  const message =
    error instanceof BackendApiError && error.status >= 400 && error.status < 500
      ? error.message
      : fallbackMessage;
  return NextResponse.json({ message }, { status });
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await requireBackendSession();
  try {
    const entries = await fetchEventGuestList(session.accessToken, params.id);
    return NextResponse.json(entries);
  } catch (error) {
    return routeErrorResponse(error, "Could not load the guest list.");
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await requireBackendSession();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "A file is required." }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const validExt = name.endsWith(".csv") || name.endsWith(".xlsx");
  const validMime =
    file.type === "text/csv" ||
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  if (!validExt && !validMime) {
    return NextResponse.json(
      { message: "Only CSV and XLSX files are supported." },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ message: "The file is empty." }, { status: 400 });
  }

  try {
    const result = await uploadEventGuestList(session.accessToken, params.id, formData);
    return NextResponse.json(result);
  } catch (error) {
    return routeErrorResponse(error, "Could not import the guest list.");
  }
}
