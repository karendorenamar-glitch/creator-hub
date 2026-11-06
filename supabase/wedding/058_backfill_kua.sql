-- Kefoo — 058: backfill the KUA checklist for existing Indonesian customers
-- Creates one builtin_kua checklist per eligible wedding that has none, with
-- the same 24 items, keys and order the app generates. Idempotent.

begin;

do $$
declare
  w record;
  v_checklist uuid;
  v_year int := date_part('year', now())::int;
begin
  for w in
    select wd.id
    from public.weddings wd
    left join public.customer_country cc on cc.user_id = wd.created_by
    where coalesce(cc.country_code, 'ID') in ('ID', 'OTHER')
      and not exists (
        select 1 from public.checklists c
        where c.wedding_id = wd.id and c.template_key = 'kua_v1'
      )
  loop
    v_checklist := null;

    insert into public.checklists (wedding_id, title, kind, template_key, template_year)
    values (
      w.id,
      'Checklist berdasarkan KUA tahun ' || v_year,
      'builtin_kua',
      'kua_v1',
      v_year
    )
    on conflict (wedding_id, template_key) do nothing
    returning id into v_checklist;

    if v_checklist is not null then
      insert into public.checklist_tasks (
        wedding_id, checklist_id, group_name, sort_order, template_item_key,
        is_required, title, description, stage, priority, status,
        due_date, assigned_to, completed_at
      )
      select w.id, v_checklist, v.group_name, v.sort_order, v.template_item_key,
             true, v.title, null, v.stage, 'medium', 'todo',
             null, null, null
      from (values
        ("Dokumen dasar calon pengantin", 0, "kua_v1_a1", "Fotokopi KTP calon suami", "planning"),
        ("Dokumen dasar calon pengantin", 1, "kua_v1_a2", "Fotokopi KTP calon istri", "planning"),
        ("Dokumen dasar calon pengantin", 2, "kua_v1_a3", "Fotokopi Kartu Keluarga (KK)", "planning"),
        ("Dokumen dasar calon pengantin", 3, "kua_v1_a4", "Fotokopi akta kelahiran atau surat keterangan lahir", "planning"),
        ("Dokumen dasar calon pengantin", 4, "kua_v1_a5", "Pas foto latar biru sesuai ukuran dan jumlah yang diminta KUA", "planning"),
        ("Dokumen dasar calon pengantin", 5, "kua_v1_a6", "Surat pengantar nikah dari desa/kelurahan (Model N1, atau formulir yang berlaku saat ini)", "planning"),
        ("Dokumen dasar calon pengantin", 6, "kua_v1_a7", "Formulir pendaftaran/kehendak nikah dan persetujuan kedua calon pengantin", "planning"),
        ("Dokumen dasar calon pengantin", 7, "kua_v1_a8", "Surat keterangan sehat jika diminta oleh KUA/fasilitas kesehatan setempat", "planning"),
        ("Dokumen wali dan saksi", 8, "kua_v1_b1", "Data serta fotokopi KTP wali nikah", "planning"),
        ("Dokumen wali dan saksi", 9, "kua_v1_b2", "Data dua orang saksi nikah", "planning"),
        ("Dokumen wali dan saksi", 10, "kua_v1_b3", "Dokumen pendukung wali sesuai kondisi, jika diminta KUA", "planning"),
        ("Dokumen wali dan saksi", 11, "kua_v1_b4", "Dokumen taukil/wakalah wali jika wali tidak hadir dan perwakilan diperlukan", "planning"),
        ("Dokumen tambahan jika berlaku", 12, "kua_v1_c1", "Surat rekomendasi nikah dari KUA asal jika menikah di luar kecamatan tempat tinggal", "planning"),
        ("Dokumen tambahan jika berlaku", 13, "kua_v1_c2", "Izin orang tua jika usia calon pengantin belum 21 tahun", "planning"),
        ("Dokumen tambahan jika berlaku", 14, "kua_v1_c3", "Dispensasi Pengadilan Agama jika usia calon pengantin di bawah ketentuan minimum", "planning"),
        ("Dokumen tambahan jika berlaku", 15, "kua_v1_c4", "Akta cerai jika berstatus cerai hidup", "planning"),
        ("Dokumen tambahan jika berlaku", 16, "kua_v1_c5", "Akta kematian pasangan jika berstatus duda/janda karena pasangan meninggal", "planning"),
        ("Dokumen tambahan jika berlaku", 17, "kua_v1_c6", "Izin atasan/kesatuan bagi anggota TNI/Polri jika diwajibkan", "planning"),
        ("Dokumen tambahan jika berlaku", 18, "kua_v1_c7", "Dokumen pengadilan untuk kondisi khusus, jika berlaku", "planning"),
        ("Sebelum hari akad", 19, "kua_v1_d1", "Daftar melalui SIMKAH atau langsung ke KUA", "final_month"),
        ("Sebelum hari akad", 20, "kua_v1_d2", "Pastikan berkas sudah diverifikasi KUA", "final_month"),
        ("Sebelum hari akad", 21, "kua_v1_d3", "Ikuti bimbingan perkawinan (Bimwin) sesuai arahan KUA", "final_month"),
        ("Sebelum hari akad", 22, "kua_v1_d4", "Konfirmasi tanggal, jam, wali, saksi, dan lokasi akad", "final_month"),
        ("Sebelum hari akad", 23, "kua_v1_d5", "Siapkan dokumen asli untuk pemeriksaan petugas", "final_month")
      ) as v(group_name, sort_order, template_item_key, title, stage)
      on conflict (checklist_id, template_item_key) do nothing;
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';

commit;

-- Verify:
--   select count(*) from public.checklists where kind = 'builtin_kua';
--   select count(*) from public.checklist_tasks where template_item_key like 'kua_v1_%';
