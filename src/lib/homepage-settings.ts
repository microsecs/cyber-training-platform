import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createAdminClient } from "@/lib/supabase/admin";
import { createR2Client, getR2BucketName } from "@/lib/r2/client";
import { DEFAULT_HOMEPAGE_SETTINGS, HomepageSettings } from "@/lib/homepage-config";

function normalize(row: any): HomepageSettings {
  return {
    heroBadge: row?.hero_badge || DEFAULT_HOMEPAGE_SETTINGS.heroBadge,
    heroTitle: row?.hero_title || DEFAULT_HOMEPAGE_SETTINGS.heroTitle,
    heroBody: row?.hero_body || DEFAULT_HOMEPAGE_SETTINGS.heroBody,
    videoKey: row?.video_key || null,
    videoUrl: row?.video_url || null,
    videoTitle: row?.video_title || DEFAULT_HOMEPAGE_SETTINGS.videoTitle,
    statsEyebrow: row?.stats_eyebrow || DEFAULT_HOMEPAGE_SETTINGS.statsEyebrow,
    statsHeading: row?.stats_heading || DEFAULT_HOMEPAGE_SETTINGS.statsHeading,
    statsBody: row?.stats_body || DEFAULT_HOMEPAGE_SETTINGS.statsBody,
    stats: Array.isArray(row?.stats) ? row.stats : DEFAULT_HOMEPAGE_SETTINGS.stats,
    experienceValue: row?.experience_value || DEFAULT_HOMEPAGE_SETTINGS.experienceValue,
    experienceLabel: row?.experience_label || DEFAULT_HOMEPAGE_SETTINGS.experienceLabel,
    subscriptionValue: row?.subscription_value || DEFAULT_HOMEPAGE_SETTINGS.subscriptionValue,
    subscriptionLabel: row?.subscription_label || DEFAULT_HOMEPAGE_SETTINGS.subscriptionLabel,
    pricingEyebrow: row?.pricing_eyebrow || DEFAULT_HOMEPAGE_SETTINGS.pricingEyebrow,
    pricingHeading: row?.pricing_heading || DEFAULT_HOMEPAGE_SETTINGS.pricingHeading,
    pricingBody: row?.pricing_body || DEFAULT_HOMEPAGE_SETTINGS.pricingBody,
    subscriptionPrice: row?.subscription_price || DEFAULT_HOMEPAGE_SETTINGS.subscriptionPrice,
    subscriptionPeriod: row?.subscription_period || DEFAULT_HOMEPAGE_SETTINGS.subscriptionPeriod,
    subscriptionFinePrint: row?.subscription_fine_print || DEFAULT_HOMEPAGE_SETTINGS.subscriptionFinePrint,
    ctaLabel: row?.cta_label || DEFAULT_HOMEPAGE_SETTINGS.ctaLabel,
    ctaUrl: row?.cta_url || DEFAULT_HOMEPAGE_SETTINGS.ctaUrl,
  };
}

export async function getHomepageSettings(): Promise<HomepageSettings & { playbackUrl: string | null }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("homepage_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) console.warn("Homepage settings unavailable; using defaults:", error.message);

    const settings = normalize(data);
    let playbackUrl = settings.videoUrl;

    if (settings.videoKey) {
      playbackUrl = await getSignedUrl(
        createR2Client(),
        new GetObjectCommand({ Bucket: getR2BucketName(), Key: settings.videoKey }),
        { expiresIn: 3600 }
      );
    }

    return { ...settings, playbackUrl };
  } catch (error) {
    console.warn("Homepage settings failed; using defaults:", error);
    return { ...DEFAULT_HOMEPAGE_SETTINGS, playbackUrl: null };
  }
}
